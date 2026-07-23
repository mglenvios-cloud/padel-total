const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const redis = require('redis');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const prisma = new PrismaClient();

// Security Headers (Helmet mock/middleware)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});

// Configure CORS depending on environment
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://127.0.0.1:3000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por política CORS'));
    }
  }
}));

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'padel_secret_super_key_2027';

// Redis Cache Node
const redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
let isRedisConnected = false;
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect()
  .then(() => { isRedisConnected = true; })
  .catch(() => console.log("Redis no disponible, ejecutando sin caché."));

// === OBSERVABILITY: HEALTH CHECK API ===
app.get('/health', async (req, res) => {
  let dbStatus = "UP";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    dbStatus = "DOWN";
  }

  res.json({
    status: (dbStatus === "UP") ? "UP" : "DEGRADED",
    services: {
      server: "UP",
      database: dbStatus,
      redis: isRedisConnected ? "UP" : "DOWN",
      websocket: "UP"
    },
    timestamp: new Date().toISOString()
  });
});

// === API ROUTES WITH SECURITY FILTERS ===
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  
  // Input Validation & Sanitization
  if (!email || !email.includes('@') || !password || password.length < 6) {
    return res.status(400).json({ error: "Datos de entrada inválidos. Contraseña mínimo de 6 caracteres." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });
    res.json({ success: true, userId: user.id });
  } catch (err) {
    res.status(400).json({ error: "Email ya registrado." });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña requeridos." });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Credenciales inválidas." });
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ success: true, token, user: { id: user.id, name: user.name, elo: user.elo, role: user.role } });
});

app.get('/api/ranking', async (req, res) => {
  if (isRedisConnected) {
    try {
      const cached = await redisClient.get('padel_ranking');
      if (cached) return res.json(JSON.parse(cached));
    } catch (e) {}
  }

  const ranking = await prisma.user.findMany({
    orderBy: { elo: 'desc' },
    take: 100
  });

  if (isRedisConnected) {
    try {
      await redisClient.setEx('padel_ranking', 300, JSON.stringify(ranking));
    } catch (e) {}
  }

  res.json(ranking);
});

// === WEBSOCKET MATCHMAKING CON ADAPTACIÓN ELO ===
const lobby = [];

// WebSocket Heartbeat (Ping/Pong)
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'join_matchmaking') {
        const player = { 
          ws, 
          userId: data.userId, 
          elo: data.elo, 
          range: 50, // Rango inicial de tolerancia ELO
          joinedAt: Date.now() 
        };
        lobby.push(player);
        ws.send(JSON.stringify({ type: 'queued' }));
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: 'Mensaje inválido' }));
    }
  });

  ws.on('close', () => {
    const idx = lobby.findIndex(p => p.ws === ws);
    if (idx !== -1) lobby.splice(idx, 1);
  });
});

// Loop de emparejamiento adaptativo
setInterval(() => {
  if (lobby.length < 2) return;

  for (let i = 0; i < lobby.length; i++) {
    const p1 = lobby[i];
    const timeInQueue = (Date.now() - p1.joinedAt) / 1000;
    
    // Expansión progresiva del rango de tolerancia ELO (10 puntos por segundo)
    p1.range = 50 + Math.floor(timeInQueue * 10);

    for (let j = i + 1; j < lobby.length; j++) {
      const p2 = lobby[j];
      const eloDiff = Math.abs(p1.elo - p2.elo);

      if (eloDiff <= p1.range || eloDiff <= p2.range) {
        // Emparejados con éxito
        const room = `room_${Date.now()}`;
        p1.ws.send(JSON.stringify({ type: 'match_found', room, opponent: p2.userId }));
        p2.ws.send(JSON.stringify({ type: 'match_found', room, opponent: p1.userId }));

        lobby.splice(j, 1);
        lobby.splice(i, 1);
        i--;
        break;
      }
    }
  }
}, 3000);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Servidor Padel Pro Endurecido en puerto ${PORT}`);
});
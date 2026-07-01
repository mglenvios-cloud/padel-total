// ============================================================
// MAIN.JS — Menú principal, navegación, perfil, preview cancha
// ============================================================

let selectedPaddleColor = '#00d4ff';
let currentGameMode = 'quick';
let previewAnim = null;

// ---- Partículas de fondo ----
function initBgCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 0.5,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    alpha: Math.random() * 0.5 + 0.1
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,212,255,${p.alpha})`;
      ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    });
    requestAnimationFrame(draw);
  }
  draw();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// ---- Preview cancha animada ----
function initPreviewCanvas() {
  const canvas = document.getElementById('preview-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 320, H = 480;
  const profile = DataManager.getProfile();

  // Pelota demo
  let ball = { x: W / 2, y: H / 2, vx: 2.5, vy: -3, r: 8 };
  let trail = [];

  // Jugadores demo
  const players = [
    { x: 60,  y: 160, color: profile.paddleColor || '#00d4ff', label: profile.name[0] || 'J', team: 0 },
    { x: 260, y: 160, color: '#7c3aed', label: 'P', team: 0 },
    { x: 60,  y: 320, color: '#ff6b35', label: 'A', team: 1 },
    { x: 260, y: 320, color: '#00ff87', label: 'B', team: 1 },
  ];

  let t = 0;

  function drawCourt(ctx, W, H) {
    // Fondo
    ctx.fillStyle = '#1a3a2a';
    ctx.fillRect(0, 0, W, H);

    // Textura suelo
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < W; i += 20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
    for (let i = 0; i < H; i += 20) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

    // Líneas de cancha
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Línea central
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(20, H / 2); ctx.lineTo(W - 20, H / 2); ctx.stroke();

    // Líneas de saque
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(W / 2, 20); ctx.lineTo(W / 2, H / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W / 2, H / 2); ctx.lineTo(W / 2, H - 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, H / 4); ctx.lineTo(W - 20, H / 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, H * 3 / 4); ctx.lineTo(W - 20, H * 3 / 4); ctx.stroke();

    // Paredes vidrio
    ctx.fillStyle = 'rgba(0,212,255,0.15)';
    ctx.fillRect(0, 0, 20, H);
    ctx.fillRect(W - 20, 0, 20, H);
    ctx.fillRect(0, 0, W, 20);
    ctx.fillRect(0, H - 20, W, 20);

    ctx.strokeStyle = 'rgba(0,212,255,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 20, H);
    ctx.strokeRect(W - 20, 0, 20, H);
    ctx.strokeRect(0, 0, W, 20);
    ctx.strokeRect(0, H - 20, W, 20);

    // Red central
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(20, H / 2 - 3, W - 40, 6);
    for (let i = 20; i < W - 20; i += 12) {
      ctx.fillStyle = i % 24 === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)';
      ctx.fillRect(i, H / 2 - 3, 6, 6);
    }
  }

  function drawPlayer(ctx, p, t) {
    const bob = Math.sin(t * 0.05 + p.x) * 3;
    // Sombra
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 18 + bob, 14, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
    // Cuerpo
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob, 16, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Inicial
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.label, p.x, p.y + bob);
    // Paleta
    ctx.save();
    ctx.translate(p.x + 18, p.y + bob - 10);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = p.color;
    ctx.fillRect(-3, -8, 6, 16);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-3, -8, 6, 16);
    ctx.restore();
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    drawCourt(ctx, W, H);

    // Trail pelota
    trail.push({ x: ball.x, y: ball.y });
    if (trail.length > 12) trail.shift();
    trail.forEach((pt, i) => {
      const alpha = (i / trail.length) * 0.4;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, ball.r * (i / trail.length), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,220,50,${alpha})`;
      ctx.fill();
    });

    // Pelota
    const grad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, ball.r);
    grad.addColorStop(0, '#fff8dc');
    grad.addColorStop(1, '#d4a017');
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(255,220,50,0.8)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Jugadores
    players.forEach(p => {
      // Movimiento suave hacia la pelota (solo demo)
      const side = p.team === 0 ? ball.y < H / 2 : ball.y > H / 2;
      if (side) {
        p.x += (ball.x - p.x) * 0.015;
        p.y += (ball.y - p.y) * 0.01;
      }
      drawPlayer(ctx, p, t);
    });

    // Mover pelota
    ball.x += ball.vx; ball.y += ball.vy;
    if (ball.x - ball.r < 20) { ball.x = 20 + ball.r; ball.vx *= -1; }
    if (ball.x + ball.r > W - 20) { ball.x = W - 20 - ball.r; ball.vx *= -1; }
    if (ball.y - ball.r < 20) { ball.y = 20 + ball.r; ball.vy *= -1; }
    if (ball.y + ball.r > H - 20) { ball.y = H - 20 - ball.r; ball.vy *= -1; }

    t++;
    previewAnim = requestAnimationFrame(frame);
  }
  frame();
}

// ---- Navegación ----
function showScreen(name) {
  document.querySelectorAll('.screen-overlay').forEach(el => el.classList.remove('active'));
  const el = document.getElementById(`screen-${name}`);
  if (el) el.classList.add('active');
  if (name === 'ranking') buildRanking();
  if (name === 'profile') buildProfile();
}

function closeScreen(name) {
  const el = document.getElementById(`screen-${name}`);
  if (el) el.classList.remove('active');
}

function startGame(mode) {
  currentGameMode = mode;
  if (mode === 'training') { launchGame('easy'); return; }
  showScreen('difficulty');
}

function launchGame(difficulty) {
  const profile = DataManager.getProfile();
  const is3D = window._launch3D === true;
  const params = new URLSearchParams({
    mode: currentGameMode,
    diff: difficulty,
    color: profile.paddleColor || '#00d4ff',
    name: profile.name || 'Jugador'
  });
  const target = is3D ? 'game3d.html' : 'game.html';
  window._launch3D = false;
  window.location.href = `${target}?${params.toString()}`;
}

function launchGame3D(difficulty) {
  window._launch3D = true;
  launchGame(difficulty);
}


// ---- Ranking ----
function buildRanking() {
  const profile = DataManager.getProfile();
  const ranking = DataManager.getRanking(profile);
  const tbody = document.getElementById('ranking-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  ranking.forEach((p, i) => {
    const rank = i + 1;
    const cls = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
    const winRate = Math.round((p.wins / Math.max(1, p.wins + p.losses)) * 100);
    const tr = document.createElement('tr');
    tr.style.cssText = p.isMe ? 'background:rgba(0,212,255,0.1);font-weight:600;' : '';
    tr.innerHTML = `
      <td><span class="rank-badge ${cls}">${rank}</span></td>
      <td>${p.isMe ? '⭐ ' : ''}${p.name}</td>
      <td>${p.country}</td>
      <td style="color:#00d4ff;font-weight:700;">${p.rating}</td>
      <td>${p.wins}/${p.losses}</td>
      <td>${winRate}%</td>
    `;
    tbody.appendChild(tr);
  });
}

// ---- Perfil ----
function buildProfile() {
  const p = DataManager.getProfile();
  const el = document.getElementById('profile-content');
  if (!el) return;
  const flags = { AR: '🇦🇷', ES: '🇪🇸', BR: '🇧🇷', MX: '🇲🇽', IT: '🇮🇹', FR: '🇫🇷', PT: '🇵🇹', BE: '🇧🇪' };
  const recentMatches = (p.matches || []).slice(0, 5).map(m => `
    <tr>
      <td>${m.date}</td>
      <td style="color:${m.result === 'Victoria' ? '#00ff87' : '#ff3366'}">${m.result}</td>
      <td>${m.score}</td>
      <td style="color:${m.ratingChange > 0 ? '#00ff87' : '#ff3366'}">${m.ratingChange > 0 ? '+' : ''}${m.ratingChange}</td>
    </tr>
  `).join('') || '<tr><td colspan="4" style="color:rgba(255,255,255,0.4);text-align:center;padding:20px;">Sin partidos todavía</td></tr>';

  el.innerHTML = `
    <div class="profile-header">
      <div class="avatar-circle" style="background:linear-gradient(135deg,${p.paddleColor},#7c3aed)">
        ${(p.name || 'J')[0].toUpperCase()}
      </div>
      <div>
        <div class="profile-name">${p.name}</div>
        <div class="profile-meta">${flags[p.nationality] || '🌍'} · ${p.age} años · ${p.hand === 'right' ? '🤜 Diestro' : '🤛 Zurdo'}</div>
        <div class="profile-meta" style="margin-top:4px;">Estilo: ${p.style === 'power' ? '💥 Potencia' : p.style === 'control' ? '🎯 Control' : '⚖️ Balanceado'}</div>
      </div>
      <div class="profile-rating">
        <div class="rating-value">${p.rating}</div>
        <div class="rating-label">ELO</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px;">
      <div class="glass-card" style="padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:#00ff87;">${p.wins}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.5)">Victorias</div>
      </div>
      <div class="glass-card" style="padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:#ff3366;">${p.losses}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.5)">Derrotas</div>
      </div>
      <div class="glass-card" style="padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:800;color:#ffd700;">${DataManager.getWinRate(p)}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.5)">Win Rate</div>
      </div>
    </div>
    <div class="section-title" style="font-size:14px;margin-bottom:12px;">Últimos Partidos</div>
    <table class="leaderboard-table">
      <thead><tr><th>Fecha</th><th>Resultado</th><th>Score</th><th>ELO</th></tr></thead>
      <tbody>${recentMatches}</tbody>
    </table>
    <button class="btn-secondary" style="width:100%;justify-content:center;margin-top:16px;" onclick="showScreen('create-player')">
      ✏ Editar Perfil
    </button>
  `;
}

// ---- Crear jugador ----
function selectPaddle(color) {
  selectedPaddleColor = color;
  document.querySelectorAll('[id^="color-"]').forEach(el => {
    el.style.border = '2px solid transparent';
    el.style.transform = 'scale(1)';
  });
  const key = color.replace('#', '');
  const el = document.getElementById(`color-${key}`);
  if (el) { el.style.border = '2px solid white'; el.style.transform = 'scale(1.2)'; }
}

function savePlayer() {
  const name = document.getElementById('player-name').value.trim();
  const age = parseInt(document.getElementById('player-age').value) || 25;
  const nationality = document.getElementById('player-nationality').value;
  const hand = document.querySelector('input[name="hand"]:checked')?.value || 'right';
  const style = document.querySelector('input[name="style"]:checked')?.value || 'balanced';

  if (!name) { showNotification('⚠️ Ingresa tu nombre', 'warning'); return; }

  const profile = DataManager.getProfile();
  Object.assign(profile, { name, age, nationality, hand, style, paddleColor: selectedPaddleColor });
  DataManager.saveProfile(profile);
  updateStatsBar();
  closeScreen('create-player');
  showNotification(`✅ Jugador "${name}" guardado`, 'success');
  initPreviewCanvas();
}

// ---- Stats bar ----
function updateStatsBar() {
  const p = DataManager.getProfile();
  const w = document.getElementById('stat-wins');
  const l = document.getElementById('stat-losses');
  const r = document.getElementById('stat-rating');
  const wr = document.getElementById('stat-winrate');
  if (w) w.textContent = p.wins;
  if (l) l.textContent = p.losses;
  if (r) r.textContent = p.rating;
  if (wr) wr.textContent = DataManager.getWinRate(p);
}

// ---- Notificación ----
function showNotification(msg, type = 'info') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  const n = document.createElement('div');
  n.className = 'notification';
  n.innerHTML = `<span>${msg}</span>`;
  n.style.borderColor = type === 'success' ? '#00ff87' : type === 'warning' ? '#ffd700' : '#00d4ff';
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3000);
}

// ---- Prellenar form con datos guardados ----
function prefillForm() {
  const p = DataManager.getProfile();
  const nameEl = document.getElementById('player-name');
  const ageEl = document.getElementById('player-age');
  const natEl = document.getElementById('player-nationality');
  if (nameEl && p.name !== 'Jugador') nameEl.value = p.name;
  if (ageEl) ageEl.value = p.age;
  if (natEl) natEl.value = p.nationality;
  const hand = document.getElementById(`hand-${p.hand}`);
  if (hand) hand.checked = true;
  const style = document.getElementById(`style-${p.style}`);
  if (style) style.checked = true;
  selectPaddle(p.paddleColor || '#00d4ff');
}

// ---- INIT ----
const LOADING_MESSAGES = [
  'Preparando la cancha...', 'Cargando física de pelota...', 
  'Entrenando IA...', 'Afinando paletas...', '¡Listo para jugar!'
];

window.addEventListener('DOMContentLoaded', () => {
  let step = 0;
  const msgEl = document.getElementById('loading-text');
  const interval = setInterval(() => {
    step++;
    if (msgEl && step < LOADING_MESSAGES.length) msgEl.textContent = LOADING_MESSAGES[step];
    if (step >= LOADING_MESSAGES.length) clearInterval(interval);
  }, 400);

  setTimeout(() => {
    const loading = document.getElementById('loading-screen');
    const main = document.getElementById('main-content');
    if (loading) { loading.style.opacity = '0'; loading.style.transition = 'opacity 0.5s'; }
    setTimeout(() => {
      if (loading) loading.style.display = 'none';
      if (main) main.style.display = 'flex';
      initBgCanvas();
      initPreviewCanvas();
      updateStatsBar();
      prefillForm();
    }, 500);
  }, 2200);
});

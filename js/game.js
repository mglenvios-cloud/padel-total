// ============================================================
// GAME.JS — Motor principal del juego, loop, lógica de partida
// ============================================================

// Parámetros de la cancha (se calculan dinámicamente)
// Cancha de pádel reglamentaria: 10m ancho × 20m largo → proporción 1:2
function buildCourt(W, H) {
  const hudTop    = 72;  // altura del HUD superior
  const hudBottom = 52;  // altura del HUD inferior
  const glassW    = 28;  // grosor de las paredes de vidrio/reja
  const netHeight = 22;  // altura visual de la red
  const meshHeight = 60; // zona de reja superior

  // Espacio disponible para dibujar la cancha
  const availW = W - glassW * 2;
  const availH = H - hudTop - hudBottom - glassW * 2;

  // Forzar proporción 1:2 (ancho:largo) — cancha de pádel real
  // Máximo ancho = availH / 2  →  para que la altura sea el doble del ancho
  const COURT_RATIO = 0.5; // ancho/largo = 10m/20m
  let courtW, courtH;
  if (availW / availH < COURT_RATIO) {
    // Limitado por el ancho disponible
    courtW = availW;
    courtH = courtW / COURT_RATIO;
  } else {
    // Limitado por la altura disponible
    courtH = availH;
    courtW = courtH * COURT_RATIO;
  }
  // Ajustar para no exceder 96% del disponible
  courtW = Math.min(courtW, availW * 0.96);
  courtH = Math.min(courtH, availH * 0.96);

  // Centrar horizontalmente en el canvas
  const offsetX = (W - courtW) / 2;
  const offsetY = hudTop + glassW;

  const wallLeft   = offsetX;
  const wallRight  = offsetX + courtW;
  const wallTop    = offsetY;
  const wallBottom = offsetY + courtH;
  const width  = courtW;
  const height = courtH;
  const netX = wallLeft + width / 2;
  const netY = wallTop + height / 2;

  // Líneas de saque a 6.95m del fondo (reglamentario → ~34.75% del largo)
  const serveFraction = 0.25;
  const serveLineTop = wallTop  + height * serveFraction;
  const serveLineBot = wallBottom - height * serveFraction;

  return {
    wallLeft, wallRight, wallTop, wallBottom,
    width, height, netX, netY,
    glassW, netHeight, meshHeight,
    serveLineTop, serveLineBot,
    ballR: 9,
  };
}

// ============================================================
// Zonas de saque reglamentarias
// ============================================================
function getServeTargetZones(court, servingTeam) {
  const c = court;
  const halfW = (c.wallRight - c.wallLeft) / 2;
  if (servingTeam === 0) {
    // Team 0 saca hacia abajo
    return [
      { x: c.wallLeft,       y: c.netY, w: halfW, h: c.serveLineBot - c.netY }, // Izq
      { x: c.wallLeft + halfW, y: c.netY, w: halfW, h: c.serveLineBot - c.netY }, // Der
    ];
  } else {
    // Team 1 saca hacia arriba
    return [
      { x: c.wallLeft,       y: c.serveLineTop, w: halfW, h: c.netY - c.serveLineTop },
      { x: c.wallLeft + halfW, y: c.serveLineTop, w: halfW, h: c.netY - c.serveLineTop },
    ];
  }
}

// ============================================================
// GAME STATE MACHINE
// ============================================================
const STATE = {
  WAITING_SERVE: 'waiting_serve',
  SERVING: 'serving',
  IN_PLAY: 'in_play',
  POINT_SCORED: 'point_scored',
  MATCH_OVER: 'match_over',
  PAUSED: 'paused',
  TRAINING: 'training',
};

// ============================================================
// CLASE PRINCIPAL DEL JUEGO
// ============================================================
class PadelGame {
  constructor(canvas, params) {
    this.canvas = canvas;
    this.params = params;
    this.mode = params.get('mode') || 'quick';
    this.difficulty = params.get('diff') || 'medium';
    this.playerName = decodeURIComponent(params.get('name') || 'Jugador');
    this.playerColor = decodeURIComponent(params.get('color') || '#00d4ff');

    this.court = buildCourt(canvas.width, canvas.height);
    this.state = this.mode === 'training' ? STATE.TRAINING : STATE.WAITING_SERVE;
    this.frame = 0;

    // Módulos
    this.scoring = new ScoringSystem();
    this.renderer = new GameRenderer(canvas, this.court);
    this.audio = new AudioEngine();
    this.input = new InputController();
    this.ui = new GameUI(this.scoring, this.mode);

    // Jugadores
    this._initPlayers();
    this._initAI();
    this._initBall();

    // Saque
    this.serveState = {
      active: false, playerIdx: 0,
      targetZone: null, servePressed: false
    };
    this._prepareServe();

    // Entrenamiento
    this.trainingStats = { hits: 0, streak: 0, bestStreak: 0, lobs: 0, smashes: 0 };
    this.trainingBallTimer = 0;

    // Estado del punto
    this.pointTimer = 0;
    this.pointPause = false;

    // Pausa
    this._setupPause();

    // Resize
    window.addEventListener('resize', () => this._handleResize());
  }

  _initPlayers() {
    const c = this.court;
    const mid = (c.wallLeft + c.wallRight) / 2;
    const q1 = c.wallTop + (c.wallBottom - c.wallTop) * 0.25;
    const q3 = c.wallTop + (c.wallBottom - c.wallTop) * 0.75;

    // Team 0 (arriba) — jugador humano + compañero IA
    this.players = [
      new Player(0, 0, mid - 60, q1,      true,  this.playerColor, this.playerName),   // HUMAN
      new Player(1, 0, mid + 60, q1,      false, '#7c3aed',         'Maya'),            // AI partner
      new Player(2, 1, mid - 60, q3,      false, '#ff6b35',         'Ramos'),           // AI rival
      new Player(3, 1, mid + 60, q3,      false, '#00ff87',         'Chen'),            // AI rival
    ];
    this.humanPlayer = this.players[0];
  }

  _initAI() {
    this.aiControllers = [
      null, // human — sin IA
      new AIController(this.players[1], this.difficulty, this.court),
      new AIController(this.players[2], this.difficulty, this.court),
      new AIController(this.players[3], this.difficulty, this.court),
    ];
  }

  _initBall() {
    this.ball = new Ball(this.court.wallRight - this.court.wallLeft, this.court.wallBottom - this.court.wallTop);
    this.ball.courtW = this.court.wallRight;
    this.ball.courtH = this.court.wallBottom;
    this.ball.active = false;
  }

  _prepareServe() {
    const st = this.scoring.servingTeam;
    // El jugador humano o el primer jugador del equipo saca
    const serverIdx = st === 0 ? 0 : 2;
    this.serveState = {
      active: true,
      playerIdx: serverIdx,
      servingTeam: st,
      targetZone: getServeTargetZones(this.court, st)[0],
      phase: 'ready',
    };
    this.ui.showServeIndicator(this.scoring.serveAttempt);
  }

  _handleResize() {
    const canvas = this.canvas;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    this.court = buildCourt(canvas.width, canvas.height);
    this.renderer.court = this.court;
    // Reposicionar jugadores
    const c = this.court;
    const mid = (c.wallLeft + c.wallRight) / 2;
    const q1 = c.wallTop + (c.wallBottom - c.wallTop) * 0.25;
    const q3 = c.wallTop + (c.wallBottom - c.wallTop) * 0.75;
    this.players[0].startX = mid - 60; this.players[0].startY = q1;
    this.players[1].startX = mid + 60; this.players[1].startY = q1;
    this.players[2].startX = mid - 60; this.players[2].startY = q3;
    this.players[3].startX = mid + 60; this.players[3].startY = q3;
    this.aiControllers.forEach(ai => { if (ai) ai.court = this.court; });
  }

  _setupPause() {
    window.addEventListener('keydown', e => {
      if (e.code === 'Escape') {
        if (this.state === STATE.PAUSED) this.resume();
        else if (this.state !== STATE.MATCH_OVER) this.pause();
      }
    });
    document.getElementById('btn-resume')?.addEventListener('click', () => this.resume());
    document.getElementById('btn-restart')?.addEventListener('click', () => location.reload());
    document.getElementById('btn-exit')?.addEventListener('click', () => location.href = 'index.html');
    document.getElementById('btn-toggle-audio')?.addEventListener('click', () => {
      const on = this.audio.toggle();
      const el = document.getElementById('btn-toggle-audio');
      if (el) el.textContent = on ? '🔊 Sonido ON' : '🔇 Sonido OFF';
    });
  }

  pause() {
    this.state = STATE.PAUSED;
    const pm = document.getElementById('pause-menu');
    if (pm) pm.classList.add('active');
  }

  resume() {
    if (this.state !== STATE.MATCH_OVER) {
      this.state = this.prevState || STATE.IN_PLAY;
    }
    const pm = document.getElementById('pause-menu');
    if (pm) pm.classList.remove('active');
  }

  // ============================================================
  // UPDATE — lógica de juego
  // ============================================================
  update() {
    if (this.state === STATE.PAUSED || this.state === STATE.MATCH_OVER) return;
    this.frame++;
    this.input.update();

    if (this.state === STATE.TRAINING) {
      this._updateTraining();
      return;
    }

    if (this.state === STATE.WAITING_SERVE) {
      this._updateServePhase();
      return;
    }

    if (this.state === STATE.POINT_SCORED) {
      this.pointTimer--;
      if (this.pointTimer <= 0) {
        this.pointPause = false;
        this._resetAfterPoint();
      }
      this._updatePlayers(); // Mantener movimiento
      return;
    }

    if (this.state === STATE.IN_PLAY) {
      this._updatePlayers();
      this._updateBall();
      this._updateAIShots();
      this._updateHumanShot();
      this._updateMessages();
    }

    this.ui.updateScoreboard();
    this.ui.updateSpeedMeter(this.ball.speed);
    this.ui.updatePowerBar(this.input.shotCharged, this.input.isCharging);
  }

  _updateServePhase() {
    const ss = this.serveState;
    const server = this.players[ss.playerIdx];

    if (ss.servingTeam === 0) {
      // Jugador humano saca
      const mv = this.input.getMovement();
      server.update(
        server.x + mv.x * server.speed,
        server.y + mv.y * server.speed,
        this.court
      );
      // Saque con ESPACIO o A
      if (this.input.keys['Space'] || this.input.keys['KeyA']) {
        if (!ss.servePressed) {
          ss.servePressed = true;
          this._executeSave(server, ss);
        }
      } else {
        ss.servePressed = false;
      }
    } else {
      // IA saca
      setTimeout(() => {
        if (this.state === STATE.WAITING_SERVE) {
          this._executeSave(server, ss);
        }
      }, 1000 + Math.random() * 800);
      this.state = STATE.IN_PLAY; // Transición temporal hasta que la IA saque
    }

    this.ui.updatePowerBar(this.input.shotCharged, this.input.isCharging);
  }

  _executeSave(server, ss) {
    const tz = ss.targetZone;
    const targetX = tz.x + tz.w / 2 + (Math.random() - 0.5) * tz.w * 0.5;
    const targetY = tz.y + tz.h / 2 + (Math.random() - 0.5) * tz.h * 0.3;
    this.ball.serve(server.x, server.y, targetX, targetY, 0.6 + Math.random() * 0.3);
    this.state = STATE.IN_PLAY;
    this.ui.hideServeIndicator();
    this.audio.playHit(0.7, 'drive');
  }

  _updatePlayers() {
    const c = this.court;
    const b = this.ball;
    const mv = this.input.getMovement();

    // Jugador humano — mover con WASD/flechas
    const human = this.humanPlayer;
    const targetX = human.x + mv.x * human.speed;
    const targetY = human.y + mv.y * human.speed;
    human.update(targetX, targetY, c);

    // IA players
    for (let i = 1; i < this.players.length; i++) {
      const ai = this.aiControllers[i];
      const p = this.players[i];
      if (ai && b.active) {
        const { targetX: tx, targetY: ty } = ai.update(b, this.players, this.frame);
        p.update(tx, ty, c);
      } else if (!b.active) {
        p.update(p.startX, p.startY, c);
      }
    }
  }

  _updateBall() {
    const event = this.ball.update(this.court);
    if (!event) return;

    if (event.type === 'bounce') {
      this.audio.playBounce(this.ball.z);
      this.renderer.addParticles(event.x, event.y, '#ffffff', 5, 0.5);
      this.renderer.addRipple(event.x, event.y, '#ffffff');

      // Doble bote → punto al equipo contrario
      if (this.ball.bounces >= 2 && this.ball.inPlay) {
        const scoringTeam = 1 - this.ball.lastHitTeam;
        this._scorePoint(scoringTeam, 'double_bounce');
      }
    }

    if (event.type === 'wall') {
      this.audio.playWall();
      this.renderer.addParticles(event.x, event.y, '#00d4ff', 6, 0.7);
    }

    if (event.type === 'net') {
      this.audio.playNet();
      this.renderer.addParticles(event.x, event.y, '#ffffff', 8, 0.6);
      // Toca la red → punto al equipo contrario
      if (this.ball.inPlay) {
        const scoringTeam = 1 - (this.ball.lastHitTeam ?? 0);
        this._scorePoint(scoringTeam, 'net');
      }
    }

    if (event.type === 'dead') {
      if (this.ball.inPlay) {
        const scoringTeam = 1 - (this.ball.lastHitTeam ?? 0);
        this._scorePoint(scoringTeam, 'error');
      }
    }

    // Verificar si la pelota cruzó la red sin rebotar
    this._checkCrossNet();
  }

  _checkCrossNet() {
    const ball = this.ball;
    const netY = this.court.netY;
    if (!ball.inPlay || !ball.active) return;

    // Si la pelota cayó al suelo del lado equivocado sin bote en el campo rival
    if (ball.z <= 0 && ball.bounces === 0) {
      const ballSide = ball.y < netY ? 0 : 1;
      if (ball.lastHitTeam === ballSide) {
        // La pelota no cruzó al campo rival
        this._scorePoint(1 - ballSide, 'no_cross');
      }
    }
  }

  _updateAIShots() {
    const ball = this.ball;
    for (let i = 1; i < this.players.length; i++) {
      const p = this.players[i];
      const ai = this.aiControllers[i];
      if (!ai || !ball.active) continue;

      // Verificar si puede golpear
      if (p.canHitBall(ball)) {
        // Solo golpea si la pelota está en su mitad
        const myHalf = p.team === 0 ? ball.y < this.court.netY : ball.y > this.court.netY;
        if (!myHalf) continue;

        // Verificar turno (no golpear si otro de mi equipo acaba de golpear)
        if (ball.lastHitTeam === p.team) continue;

        const shotType = ai.decideShotType(ball);
        if (shotType === null) {
          // Error no forzado
          this._scorePoint(1 - p.team, 'error');
          ball.active = false;
          continue;
        }

        const target = ai.getTargetPoint();
        const power = 0.5 + Math.random() * 0.5;
        p.swing(shotType);
        ball.hit(p, shotType, power, target.x, target.y);
        this.audio.playHit(power, shotType);
        this.renderer.addParticles(p.x, p.y, p.color, 8, power);

        if (shotType === 'smash') {
          this.renderer.addParticles(p.x, p.y, '#ffd700', 15, 1);
          this.ui.showPointAlert(-1, '⚡ SMASH!', '#ffd700');
        }
      }
    }
  }

  _updateHumanShot() {
    const human = this.humanPlayer;
    const ball = this.ball;
    if (!ball.active) return;

    const power = this.input.getReleaseShot();
    if (power !== null && human.canHitBall(ball)) {
      // Verificar que la pelota está en mi mitad o puedo volarla
      const myHalf = ball.y < this.court.netY; // Team 0 está arriba
      if (!myHalf && ball.z < 10) return; // No puede golpear en zona rival en el suelo

      const shotType = this.input.getShotType();
      // Calcular dirección: hacia el campo rival
      const c = this.court;
      const targetX = c.wallLeft + 20 + Math.random() * (c.width - 40);
      const targetY = c.netY + 30 + Math.random() * (c.wallBottom - c.netY - 60);

      human.swing(shotType);
      ball.hit(human, shotType, power, targetX, targetY);
      this.audio.playHit(power, shotType);
      this.renderer.addParticles(human.x, human.y, this.playerColor, 10, power);

      // Efectos especiales
      if (shotType === 'smash') {
        this.renderer.addParticles(human.x, human.y, '#ffd700', 20, 1);
        this.ui.showPointAlert(-1, '⚡ SMASH!', '#ffd700');
        this.audio.playGameWon();
      } else if (shotType === 'lob') {
        this.ui.showPointAlert(-1, '🎯 GLOBO', '#00d4ff');
      }
    }
  }

  _updateMessages() {
    // Mensajes del compañero IA
    const partnerAI = this.aiControllers[1];
    if (partnerAI) {
      const msg = partnerAI.shouldSendMessage(this.frame);
      if (msg) this.ui.showAIMessage(msg);
    }
  }

  // ---- Punto anotado ----
  _scorePoint(team, reason) {
    if (this.state === STATE.POINT_SCORED || this.state === STATE.MATCH_OVER) return;

    this.ball.active = false;
    this.ball.inPlay = false;

    // Tipo de punto
    const type = reason === 'error' ? 'error' : reason === 'net' ? 'error' : 'winner';
    const result = this.scoring.addPoint(team, type);

    this.audio.playPoint(team === 0);
    this.renderer.addParticles(this.court.netX, this.court.netY, team === 0 ? '#00ff87' : '#ff6b35', 20, 1);

    // Mostrar alerta
    if (result) {
      if (result.type === 'match_won') {
        this._endMatch(team);
        return;
      } else if (result.type === 'set_won') {
        this.audio.playGameWon();
        this.ui.showPointAlert(team, team === 0 ? `🏆 SET ${result.sets[0]}-${result.sets[1]}` : `❌ SET RIVAL`, team === 0 ? '#ffd700' : '#ff6b35');
        // Mensaje IA
        this.ui.showAIMessage(team === 0 ? '¡Vamos! ¡Set nuestro!' : '...');
      } else if (result.type === 'game') {
        this.audio.playGameWon();
        this.ui.showPointAlert(team, team === 0 ? '✅ JUEGO' : '❌ JUEGO RIVAL', team === 0 ? '#00ff87' : '#ff3366');
      } else if (result.type === 'deuce') {
        this.ui.showPointAlert(-1, '⚖️ DEUCE', '#ffd700');
      } else if (result.type === 'advantage') {
        this.ui.showPointAlert(team, team === 0 ? '⬆️ VENTAJA' : '⬇️ VENTAJA RIVAL', team === 0 ? '#00d4ff' : '#ff6b35');
      } else {
        this.ui.showPointAlert(team, team === 0 ? '✅ PUNTO' : '❌ PUNTO', team === 0 ? '#00d4ff' : '#ff6b35');
      }
    }

    this.state = STATE.POINT_SCORED;
    this.pointTimer = 150; // ~2.5 seg a 60fps — más tiempo para respirar

    this.ui.updateScoreboard();
  }

  _resetAfterPoint() {
    // Resetear posiciones
    this.players.forEach(p => p.resetPosition());
    this._prepareServe();
    this.state = STATE.WAITING_SERVE;
  }

  _endMatch(winner) {
    this.state = STATE.MATCH_OVER;
    this.audio.playGameWon();
    setTimeout(() => {
      this.ui.showMatchResult(winner === 0, this.scoring, DataManager.getProfile());
    }, 1500);
  }

  // ============================================================
  // MODO ENTRENAMIENTO
  // ============================================================
  _updateTraining() {
    const mv = this.input.getMovement();
    const human = this.humanPlayer;
    human.update(human.x + mv.x * human.speed, human.y + mv.y * human.speed, this.court);

    // Lanzar pelota automáticamente
    this.trainingBallTimer--;
    if (!this.ball.active || this.trainingBallTimer <= 0) {
      this._launchTrainingBall();
    }

    // Update ball
    const event = this.ball.update(this.court);
    if (event) {
      if (event.type === 'bounce') { this.audio.playBounce(); this.renderer.addRipple(event.x, event.y, '#fff'); }
      if (event.type === 'wall') { this.audio.playWall(); this.renderer.addParticles(event.x, event.y, '#00d4ff', 5, 0.5); }
      if (event.type === 'dead') { this.trainingBallTimer = 80; this.trainingStats.streak = 0; }
    }

    // Golpe del jugador en entrenamiento
    const power = this.input.getReleaseShot();
    if (power !== null && human.canHitBall(this.ball)) {
      const shotType = this.input.getShotType();
      const c = this.court;
      const targetX = c.wallLeft + 30 + Math.random() * (c.width - 60);
      const targetY = c.netY + 20 + Math.random() * (c.wallBottom - c.netY - 40);
      human.swing(shotType);
      this.ball.hit(human, shotType, power, targetX, targetY);
      this.audio.playHit(power, shotType);
      this.renderer.addParticles(human.x, human.y, this.playerColor, 8, power);
      this.trainingStats.hits++;
      this.trainingStats.streak++;
      if (this.trainingStats.streak > this.trainingStats.bestStreak) this.trainingStats.bestStreak = this.trainingStats.streak;
      if (shotType === 'lob') this.trainingStats.lobs++;
      if (shotType === 'smash') this.trainingStats.smashes++;
      this.trainingBallTimer = 200;
    }

    this.ui.updateTrainingStats(this.trainingStats);
    this.ui.updatePowerBar(this.input.shotCharged, this.input.isCharging);
  }

  _launchTrainingBall() {
    const c = this.court;
    const fromX = c.wallLeft + 40 + Math.random() * (c.width - 80);
    const fromY = c.netY + 60 + Math.random() * (c.wallBottom - c.netY - 100);
    // Lanzar hacia el jugador
    const toX = this.humanPlayer.x + (Math.random() - 0.5) * 100;
    const toY = this.humanPlayer.y + (Math.random() - 0.5) * 60;
    this.ball.serve(fromX, fromY, toX, toY, 0.4 + Math.random() * 0.3);
    this.ball.lastHitTeam = 1;
    this.trainingBallTimer = 300;
  }

  // ============================================================
  // RENDER
  // ============================================================
  render() {
    this.renderer.render(
      this.ball,
      this.players,
      this.humanPlayer,
      this.serveState
    );
  }

  // ============================================================
  // GAME LOOP
  // ============================================================
  start() {
    const TARGET_FPS = 60;
    const FRAME_DURATION = 1000 / TARGET_FPS;
    let lastTime = performance.now();
    let accumulator = 0;

    const loop = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      accumulator += deltaTime;

      // Cap accumulator to prevent spiral of death
      if (accumulator > FRAME_DURATION * 5) {
        accumulator = FRAME_DURATION * 5;
      }

      // Fixed timestep updates
      while (accumulator >= FRAME_DURATION) {
        this.update();
        accumulator -= FRAME_DURATION;
      }

      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

// ============================================================
// INICIALIZACIÓN
// ============================================================
window.addEventListener('load', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  // Ajustar tamaño
  function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const params = new URLSearchParams(window.location.search);
  const game = new PadelGame(canvas, params);
  window.gameInstance = game;
  game.start();

  // Actualizar HUD nombres
  const mode = params.get('mode') || 'quick';
  const playerName = decodeURIComponent(params.get('name') || 'Jugador');
  const team0NamesEl = document.getElementById('team0-players');
  const team1NamesEl = document.getElementById('team1-players');
  if (team0NamesEl) team0NamesEl.textContent = `${playerName} · Maya`;
  if (team1NamesEl) team1NamesEl.textContent = `Ramos · Chen`;

  // Modo entrenamiento: mostrar overlay diferente
  if (mode === 'training') {
    document.getElementById('training-overlay')?.classList.add('active');
    const si = document.getElementById('serve-indicator');
    if (si) si.style.display = 'none';
  }
});

// ============================================================
// GAME3D.JS — Motor principal del juego de pádel 3D
// Three.js + Cannon-es + Lógica de juego
// ============================================================

// Colores de jugadores
const PLAYER_COLORS = {
  human:   0x00d4ff,
  partner: 0x7c3aed,
  rivalA:  0xff6b35,
  rivalB:  0x00ff87,
};

// ── ESTADO DE JUEGO ───────────────────────────────────────────
const STATE3D = {
  WAITING_SERVE: 'waiting_serve',
  IN_PLAY:       'in_play',
  POINT_SCORED:  'point_scored',
  MATCH_OVER:    'match_over',
  PAUSED:        'paused',
  TRAINING:      'training',
};

// ── CLASE PRINCIPAL ─────────────────────────────────────────
class PadelGame3D {
  constructor(canvas, params) {
    this.canvas = canvas;
    this.params = params;
    this.mode       = params.get('mode') || 'quick';
    this.difficulty = params.get('diff') || 'medium';
    this.playerName = decodeURIComponent(params.get('name') || 'Jugador');
    this.playerColor = parseInt((params.get('color') || '#00d4ff').replace('#',''), 16);

    this.state = this.mode === 'training' ? STATE3D.TRAINING : STATE3D.WAITING_SERVE;
    this.frame = 0;
    this.lastTime = performance.now();
    this.pointTimer = 0;

    // Módulos core
    this.scoring  = new ScoringSystem();
    try { this.audio = new AudioEngine(); } catch(e) { this.audio = { playHit(){}, playBounce(){}, playWall(){}, playNet(){}, playStep(){}, playBreath(){}, playCrowdCheer(){}, playCrowdClap(){}, playRefereeCall(){}, playPoint(){}, playGameWon(){}, toggle(){} }; console.warn('AudioEngine no disponible, usando stub:', e.message); }
    this.input    = new InputController();
    this.ui       = new GameUI(this.scoring, this.mode);

    // Renderer y física 3D
    this.renderer3d = new GameRenderer3D(canvas);
    this.physics    = new PhysicsWorld3D();

    // Jugadores en coordenadas 3D
    this.players = this._initPlayers();

    // IA controllers
    this.aiControllers = this._initAI();

    // Pelota
    this.ballMesh = this.renderer3d.createBallMesh();
    this.ballSpeed = 0;

    // Colisiones
    this._setupPhysicsEvents();

    // Saque
    this.serveState = { team: 0, playerIdx: 0, pressed: false };
    this._prepareServe();

    // Entrenamiento
    this.trainingStats = { hits: 0, streak: 0, bestStreak: 0, lobs: 0, smashes: 0 };
    this.trainingTimer = 0;

    // Pausa
    this._setupPause();

    // Resize
    window.addEventListener('resize', () => this._resize());
    this._resize();

    // HUD nombres
    const el0 = document.getElementById('team0-players');
    const el1 = document.getElementById('team1-players');
    if (el0) el0.textContent = `${this.playerName} · Maya`;
    if (el1) el1.textContent = `Ramos · Chen`;
  }

  _initPlayers() {
    // Posiciones 3D: human + partner en Z>0 (lado cámara), rivales en Z<0
    const configs = [
      { id: 0, team: 0, isHuman: true,  color: this.playerColor,       name: this.playerName, x: -2, z: 7  },
      { id: 1, team: 0, isHuman: false, color: PLAYER_COLORS.partner,  name: 'Maya',          x:  2, z: 7  },
      { id: 2, team: 1, isHuman: false, color: PLAYER_COLORS.rivalA,   name: 'Ramos',         x: -2, z: -7 },
      { id: 3, team: 1, isHuman: false, color: PLAYER_COLORS.rivalB,   name: 'Chen',          x:  2, z: -7 },
    ];

    return configs.map(c => {
      const mesh = this.renderer3d.createPlayerMesh(c.color, c.name, c.isHuman);
      mesh.position.set(c.x, 0, c.z);
      return {
        ...c,
        mesh,
        startX: c.x, startZ: c.z,
        speed: 6.5 + (this.difficulty === 'hard' ? 1.0 : this.difficulty === 'easy' ? -1.0 : 0),
        isSwinging: false, swingTimer: 0,
        color: c.color,
      };
    });
  }

  _initAI() {
    return [
      null, // human — sin IA
      new AIController3D(this.players[1], this.difficulty),
      new AIController3D(this.players[2], this.difficulty),
      new AIController3D(this.players[3], this.difficulty),
    ];
  }

  _setupPhysicsEvents() {
    this.physics.onBounce = (e) => {
      this.audio.playBounce(e.y, e.x, e.z);
      this.renderer3d.addParticles3D(e.x, 0.1, e.z, 0xffffff, 5, 0.5);
      // 2 botes → punto
      if (this.physics.ballBody.userData.bounces >= 2 && this.state === STATE3D.IN_PLAY) {
        const scoringTeam = 1 - (this.physics.ballBody.userData.lastHitTeam ?? 0);
        this._scorePoint(scoringTeam, 'double_bounce');
      }
    };

    this.physics.onWall = (e) => {
      this.audio.playWall(e.x, e.z);
      this.renderer3d.addParticles3D(e.x, e.y, e.z, 0x00d4ff, 6, 0.7);
    };

    this.physics.onNet = (e) => {
      this.audio.playNet(e.x, e.z);
      this.renderer3d.addParticles3D(e.x, e.y, e.z, 0xffffff, 8, 0.6);
      if (this.state === STATE3D.IN_PLAY) {
        const scoringTeam = 1 - (this.physics.ballBody.userData.lastHitTeam ?? 0);
        this._scorePoint(scoringTeam, 'net');
      }
    };
  }

  _prepareServe() {
    const st = this.scoring.servingTeam;
    const serverIdx = st === 0 ? 0 : 2;
    this.serveState = { team: st, playerIdx: serverIdx, pressed: false, aiServeScheduled: false };
    this.physics.reset();
    this.ballMesh.visible = false;
    this.ui.showServeIndicator(this.scoring.serveAttempt);
  }

  _setupPause() {
    window.addEventListener('keydown', e => {
      if (e.code === 'Escape') {
        this.state === STATE3D.PAUSED ? this.resume() : this.pause();
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

  pause()  {
    this.prevState = this.state;
    this.state = STATE3D.PAUSED;
    document.getElementById('pause-menu')?.classList.add('active');
  }
  resume() {
    this.state = this.prevState || STATE3D.IN_PLAY;
    document.getElementById('pause-menu')?.classList.remove('active');
  }

  _resize() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    // NO asignar canvas.width/height directamente — destruye el contexto WebGL
    this.renderer3d.resize(W, H);
  }

  // ════════════════════════════════════════════════════════════
  // UPDATE
  // ════════════════════════════════════════════════════════════
  update(dt) {
    if (this.state === STATE3D.PAUSED || this.state === STATE3D.MATCH_OVER) return;
    this.frame++;
    this.input.update();

    if (this.state === STATE3D.TRAINING) { this._updateTraining(dt); return; }

    // Grabación de Replay Buffer en tiempo real
    if (this.state === STATE3D.IN_PLAY || this.state === STATE3D.WAITING_SERVE) {
      if (!this.replayBuffer) this.replayBuffer = [];
      const bp = this.physics.ballBody.position;
      this.replayBuffer.push({
        ballPos: new THREE.Vector3(bp.x, bp.y, bp.z),
        ballSpeed: this.ballSpeed,
        players: this.players.map(p => ({
          x: p.mesh.position.x,
          z: p.mesh.position.z,
          isSwinging: p.isSwinging,
          animState: p.mesh.userData.animState
        }))
      });
      if (this.replayBuffer.length > 500) this.replayBuffer.shift();
    }

    if (this.state === STATE3D.WAITING_SERVE) { this._updateServe(dt); return; }

    if (this.state === STATE3D.POINT_SCORED) {
      this.pointTimer -= dt;
      if (this.pointTimer <= 0) {
        this.isReplaying = false;
        const repEl = document.getElementById('replay-indicator');
        if (repEl) repEl.style.display = 'none';
        this._resetAfterPoint();
      }
      
      // Reproducción de Replay en Cámara Lenta (Replay System)
      if (this.replayBuffer && this.replayBuffer.length > 50) {
        if (!this.isReplaying) {
          this.isReplaying = true;
          this.replayIndex = Math.max(0, this.replayBuffer.length - 180);
        }
        const frameData = this.replayBuffer[this.replayIndex];
        if (frameData) {
          this.ballMesh.position.copy(frameData.ballPos);
          this.ballMesh.visible = true;
          this.players.forEach((p, idx) => {
            const pData = frameData.players[idx];
            if (pData) {
              p.mesh.position.x = pData.x;
              p.mesh.position.z = pData.z;
              p.isSwinging = pData.isSwinging;
              p.mesh.userData.animState = pData.animState;
            }
          });
          
          const repEl = document.getElementById('replay-indicator');
          if (repEl) repEl.style.display = 'block';
          
          if (this.frame % 2 === 0) {
            this.replayIndex++;
            if (this.replayIndex >= this.replayBuffer.length) {
              this.isReplaying = false;
              if (repEl) repEl.style.display = 'none';
            }
          }
        }
      }
      return;
    }

    if (this.state === STATE3D.IN_PLAY) {
      this._movePlayers(dt);
      this.physics.step(dt);
      this._syncBallMesh();
      this._checkAIShots();
      this._checkHumanShot();
      this._checkBallDead();
      this._updateMessages();
    }

    this.ui.updateScoreboard();
    this.ui.updateSpeedMeter(this.ballSpeed);
    this.ui.updatePowerBar(this.input.shotCharged, this.input.isCharging);
  }

  _updateServe(dt) {
    const server = this.players[this.serveState.playerIdx];
    const mv = this.input.getMovement();

    // Mover servidor (solo jugador humano en su equipo)
    if (this.serveState.team === 0) {
      server.mesh.position.x = Math.max(-4.5, Math.min(4.5, server.mesh.position.x + mv.x * server.speed * dt));
      server.mesh.position.z = Math.max(0.5,  Math.min(9.5, server.mesh.position.z + mv.y * server.speed * dt));
    }

    // Saque con Space o A
    if (this.serveState.team === 0) {
      if ((this.input.keys['Space'] || this.input.keys['KeyA']) && !this.serveState.pressed) {
        this.serveState.pressed = true;
        this._executeServe(server);
      } else if (!this.input.keys['Space'] && !this.input.keys['KeyA']) {
        this.serveState.pressed = false;
      }
    } else {
      // IA saca automáticamente (una sola vez)
      if (!this.serveState.aiServeScheduled) {
        this.serveState.aiServeScheduled = true;
        const delay = 800 + Math.random() * 600;
        setTimeout(() => {
          if (this.state === STATE3D.WAITING_SERVE) {
            this._executeServe(server);
          }
        }, delay);
      }
    }
    this.ui.updatePowerBar(this.input.shotCharged, this.input.isCharging);
  }

  _executeServe(server) {
    const fromX = server.mesh.position.x;
    const fromZ = server.mesh.position.z;
    // Zona de destino: campo contrario diagonal
    const st = this.serveState.team;
    const toX = (Math.random() - 0.5) * 8;
    const toZ = st === 0 ? -3 - Math.random() * 4 : 3 + Math.random() * 4;
    this.physics.serve(fromX, fromZ, toX, toZ, 0.6 + Math.random() * 0.3, st);
    this.ballMesh.visible = true;
    this.state = STATE3D.IN_PLAY;
    this.ui.hideServeIndicator();
    this.audio.playHit(0.7, 'drive', fromX, fromZ);
    server.isSwinging = true; server.swingTimer = 18;
  }

  _movePlayers(dt) {
    const mv = this.input.getMovement();
    const human = this.players[0];
    const bp = this.physics.ballBody.position;
    const bv = this.physics.ballBody.velocity;

    // Pasos y respiración del jugador humano
    if (human.stepTimer === undefined) human.stepTimer = 0;
    if (human.breathTimer === undefined) human.breathTimer = 0;
    
    const humanMoving = Math.abs(mv.x) > 0.1 || Math.abs(mv.y) > 0.1;
    if (humanMoving) {
      human.stepTimer += dt;
      if (human.stepTimer > 0.32) {
        this.audio.playStep(human.mesh.position.x, human.mesh.position.z);
        human.stepTimer = 0;
      }
      human.breathTimer += dt;
      if (human.breathTimer > 1.8) {
        this.audio.playBreath(human.mesh.position.x, human.mesh.position.z);
        human.breathTimer = 0;
      }
    }

    human.mesh.position.x = Math.max(-4.5, Math.min(4.5, human.mesh.position.x + mv.x * human.speed * dt));
    human.mesh.position.z = Math.max(0.3,  Math.min(9.8, human.mesh.position.z + mv.y * human.speed * dt));

    // AI players — usar AIController3D
    this.players.forEach((p, i) => {
      if (p.isHuman) return;
      if (p.swingTimer > 0) { p.swingTimer--; if (p.swingTimer === 0) p.isSwinging = false; }

      const ai = this.aiControllers[i];
      if (!ai) return;

      const oldX = p.mesh.position.x;
      const oldZ = p.mesh.position.z;

      ai.update(bp, bv, this.players, this.frame);
      ai.moveToTarget(dt);

      // Pasos del jugador de la IA
      const dx = p.mesh.position.x - oldX;
      const dz = p.mesh.position.z - oldZ;
      const moved = Math.sqrt(dx * dx + dz * dz);
      if (p.stepTimer === undefined) p.stepTimer = 0;
      if (moved > 0.005) {
        p.stepTimer += dt;
        if (p.stepTimer > 0.35) {
          this.audio.playStep(p.mesh.position.x, p.mesh.position.z);
          p.stepTimer = 0;
        }
      }
    });
  }

  _syncBallMesh() {
    const bp = this.physics.ballBody.position;
    const bq = this.physics.ballBody.quaternion;
    this.ballMesh.position.set(bp.x, bp.y, bp.z);
    this.ballMesh.quaternion.set(bq.x, bq.y, bq.z, bq.w);
    const bv = this.physics.ballBody.velocity;
    this.ballSpeed = Math.sqrt(bv.x*bv.x + bv.y*bv.y + bv.z*bv.z) * 3.6; // m/s to km/h
  }

  _checkAIShots() {
    const bp = this.physics.ballBody.position;
    const lastHit = this.physics.ballBody.userData.lastHitTeam;

    this.players.forEach((p, i) => {
      if (p.isHuman || p.swingTimer > 0) return;
      if (p.team === lastHit) return; // No pegue dos veces seguido

      const ai = this.aiControllers[i];
      if (!ai) return;

      // Usar el canHit del AI controller
      if (!ai.canHit(bp)) return;

      // Verificar que la pelota está en su mitad
      const myHalf = (p.team === 0 && bp.z > 0) || (p.team === 1 && bp.z < 0);
      if (!myHalf) return;

      // Decidir tipo de golpe
      const shotType = ai.decideShotType(bp);

      // Error no forzado
      if (shotType === null) {
        this._scorePoint(1 - p.team, 'error');
        return;
      }

      // Target: campo contrario (usando AI)
      const target = ai.getTargetPoint();
      const power = 0.5 + Math.random() * 0.5;

      const playerPos = { x: p.mesh.position.x, y: 0, z: p.mesh.position.z };
      this.physics.hit(playerPos, shotType, power, target.x, target.z, p.team);
      this.audio.playHit(power, shotType, p.mesh.position.x, p.mesh.position.z);
      this.renderer3d.addParticles3D(p.mesh.position.x, 1, p.mesh.position.z, p.color, 8, power);
      p.isSwinging = true; p.swingTimer = 18;

      if (shotType === 'smash') {
        this.renderer3d.addParticles3D(p.mesh.position.x, 1.5, p.mesh.position.z, 0xffd700, 15, 1);
        this.ui.showPointAlert(-1, '⚡ SMASH!', '#ffd700');
        this.renderer3d.triggerShake(0.35);
      }
    });
  }

  _checkHumanShot() {
    const power = this.input.getReleaseShot();
    if (power === null) return;

    const human = this.players[0];
    const playerPos = { x: human.mesh.position.x, y: 0, z: human.mesh.position.z };

    if (!this.physics.canPlayerHit(playerPos)) return;
    if (this.physics.ballBody.userData.lastHitTeam === 0) return;

    const shotType = this.input.getShotType();
    const toX = (Math.random() - 0.5) * 8;
    const toZ = -(2 + Math.random() * 7); // Hacia campo rival (Z<0)

    this.physics.hit(playerPos, shotType, power, toX, toZ, 0);
    this.audio.playHit(power, shotType, human.mesh.position.x, human.mesh.position.z);
    this.renderer3d.addParticles3D(human.mesh.position.x, 1, human.mesh.position.z, 0x00d4ff, 10, power);
    human.isSwinging = true; human.swingTimer = 18;

    if (shotType === 'smash') {
      this.renderer3d.addParticles3D(human.mesh.position.x, 2, human.mesh.position.z, 0xffd700, 20, 1);
      this.ui.showPointAlert(-1, '⚡ SMASH!', '#ffd700');
      this.audio.playGameWon();
      this.renderer3d.triggerShake(0.4);
    } else if (shotType === 'lob') {
      this.ui.showPointAlert(-1, '🎯 GLOBO', '#00d4ff');
    }
  }

  _checkBallDead() {
    if (this.physics.isBallDead() && this.state === STATE3D.IN_PLAY) {
      const scoringTeam = 1 - (this.physics.ballBody.userData.lastHitTeam ?? 0);
      this._scorePoint(scoringTeam, 'error');
    }
  }

  _updateMessages() {
    // Mensajes del compañero IA (Maya — index 1)
    const partnerAI = this.aiControllers[1];
    if (partnerAI) {
      const msg = partnerAI.shouldSendMessage(this.frame);
      if (msg) this.ui.showAIMessage(msg);
    }
  }

  _scorePoint(team, reason) {
    if (this.state === STATE3D.POINT_SCORED || this.state === STATE3D.MATCH_OVER) return;
    this.ballMesh.visible = false;

    const type = (reason === 'error' || reason === 'net') ? 'error' : 'winner';
    const result = this.scoring.addPoint(team, type);

    this.audio.playPoint(team === 0);
    
    // Árbitro canta la jugada y público reacciona
    if (reason === 'error' || reason === 'net') {
      this.audio.playRefereeCall('out');
      this.audio.playCrowdClap();
    } else {
      this.audio.playRefereeCall('in');
      this.audio.playCrowdCheer();
    }

    const bp = this.physics.ballBody.position;
    this.renderer3d.addParticles3D(bp.x, bp.y, bp.z, team === 0 ? 0x00ff87 : 0xff6b35, 20, 1);

    if (result) {
      if (result.type === 'match_won') { this._endMatch(team); return; }
      if (result.type === 'set_won') {
        this.audio.playGameWon();
        this.ui.showPointAlert(team, team === 0 ? `🏆 SET ${result.sets[0]}-${result.sets[1]}` : '❌ SET RIVAL', team === 0 ? '#ffd700' : '#ff6b35');
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

    this.state = STATE3D.POINT_SCORED;
    this.pointTimer = 2.5; // Más tiempo para respirar entre puntos
    this.ui.updateScoreboard();
  }

  _resetAfterPoint() {
    this.players.forEach(p => { p.mesh.position.x = p.startX; p.mesh.position.z = p.startZ; });
    this.physics.reset();
    this._prepareServe();
    this.state = STATE3D.WAITING_SERVE;
  }

  _endMatch(winner) {
    this.state = STATE3D.MATCH_OVER;
    this.audio.playGameWon();
    setTimeout(() => this.ui.showMatchResult(winner === 0, this.scoring, DataManager.getProfile()), 1500);
  }

  // ── MODO ENTRENAMIENTO ─────────────────────────────────────
  _updateTraining(dt) {
    const mv = this.input.getMovement();
    const human = this.players[0];
    human.mesh.position.x = Math.max(-4.5, Math.min(4.5, human.mesh.position.x + mv.x * human.speed * dt));
    human.mesh.position.z = Math.max(0.3, Math.min(9.8, human.mesh.position.z + mv.y * human.speed * dt));

    this.trainingTimer -= dt;
    if (!this.ballMesh.visible || this.trainingTimer <= 0 || this.physics.isBallDead()) {
      this._launchTrainingBall();
    }
    this.physics.step(dt);
    this._syncBallMesh();

    const power = this.input.getReleaseShot();
    if (power !== null) {
      const playerPos = { x: human.mesh.position.x, y: 0, z: human.mesh.position.z };
      if (this.physics.canPlayerHit(playerPos)) {
        const shotType = this.input.getShotType();
        this.physics.hit(playerPos, shotType, power, (Math.random()-0.5)*8, -(2+Math.random()*7), 0);
        this.audio.playHit(power, shotType, human.mesh.position.x, human.mesh.position.z);
        this.renderer3d.addParticles3D(human.mesh.position.x, 1, human.mesh.position.z, 0x00d4ff, 8, power);
        this.trainingStats.hits++;
        this.trainingStats.streak++;
        if (this.trainingStats.streak > this.trainingStats.bestStreak) this.trainingStats.bestStreak = this.trainingStats.streak;
        if (shotType === 'lob') this.trainingStats.lobs++;
        if (shotType === 'smash') this.trainingStats.smashes++;
        human.isSwinging = true; human.swingTimer = 18;
        this.trainingTimer = 5;
      }
    }
    this.ui.updateTrainingStats(this.trainingStats);
    this.ui.updatePowerBar(this.input.shotCharged, this.input.isCharging);
  }

  _launchTrainingBall() {
    const fromX = (Math.random() - 0.5) * 6;
    const fromZ = -5 - Math.random() * 4;
    const toX = this.players[0].mesh.position.x + (Math.random() - 0.5) * 2;
    const toZ = this.players[0].mesh.position.z + (Math.random() - 0.5) * 1;
    this.physics.serve(fromX, fromZ, toX, toZ, 0.4 + Math.random() * 0.3, 1);
    this.ballMesh.visible = true;
    this.physics.ballBody.userData.lastHitTeam = 1;
    this.trainingTimer = 4;
    if (this.trainingStats.streak > 0 && !this.physics.ballBody.userData.inPlay) this.trainingStats.streak = 0;
  }

  // ── RENDER ─────────────────────────────────────────────────
  render(dt) {
    try {
      const ballPos = this.ballMesh && this.ballMesh.visible && this.physics && this.physics.ballBody
        ? this.physics.ballBody.position
        : { x: 0, y: 0.5, z: 0 };
      this.renderer3d.render(ballPos, this.players, this.ballSpeed, this.frame, dt);
    } catch(e) { console.warn('[render] error:', e.message); }
  }

  // ── GAME LOOP ──────────────────────────────────────────────
  start() {
    const loop = (now) => {
      // RAF primero: aunque update/render fallen, el próximo frame sigue programado
      requestAnimationFrame(loop);
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;
      try { this.update(dt); } catch(e) { console.warn('[update] error:', e.message); }
      try { this.render(dt); } catch(e) { console.warn('[render] error:', e.message); }
    };
    requestAnimationFrame(loop);
  }
}

window.PadelGame3D = PadelGame3D;

// ── INICIALIZACIÓN ────────────────────────────────────────────
function initGame3D() {
  if (window.gameInstance) return; // Evitar doble ejecución
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  // Canvas size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const params = new URLSearchParams(window.location.search);
  try {
    const game = new PadelGame3D(canvas, params);
    window.gameInstance = game;
    game.start();

    const mode = params.get('mode') || 'quick';
    if (mode === 'training') {
      document.getElementById('training-overlay')?.classList.add('active');
      document.getElementById('serve-indicator') && (document.getElementById('serve-indicator').style.display = 'none');
    }

    // Ocultar pantalla de carga de inmediato
    const loader = document.getElementById('loading-3d');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => { try { loader.remove(); } catch(e){} }, 800);
    }
  } catch (error) {
    console.error("Error al inicializar el motor 3D:", error);
    const loaderText = document.querySelector('#loading-3d .loading-text');
    const loaderSpinner = document.querySelector('#loading-3d .loading-spinner');
    const loaderTitle = document.querySelector('#loading-3d .loading-title');

    // Mensaje de error real para diagnóstico
    const errorMsg = error && error.message ? error.message : String(error);
    const errorStack = error && error.stack ? error.stack.split('\n').slice(0,3).join('<br>') : '';

    if (loaderText && loaderTitle) {
      loaderTitle.style.color = '#ff3366';
      loaderTitle.textContent = '⚡ ERROR DE INICIO';
      if (loaderSpinner) loaderSpinner.style.display = 'none';

      loaderText.innerHTML = `
        <div style="color: rgba(255,255,255,0.85); max-width: 520px; margin: 15px auto; line-height: 1.7; text-transform: none; font-family: monospace; text-align: left; background:rgba(255,50,50,0.08); padding:12px 16px; border-radius:8px; border:1px solid rgba(255,80,80,0.3); font-size:13px;">
          <b style="color:#ff6b6b;">ERROR:</b> ${errorMsg}<br><br>
          <span style="color:rgba(255,255,255,0.45); font-size:11px;">${errorStack}</span>
        </div>
        <button onclick="window.location.href='game.html'+window.location.search" class="btn-primary" style="margin-top: 20px; font-weight: 700; background: linear-gradient(135deg, #ff6b35, #ff3366); color: white; border: none; padding: 12px 28px; border-radius: 8px; cursor: pointer;">
          JUGAR EN MODO 2D (SOPORTADO)
        </button>
      `;
    } else {
      alert("Error: " + errorMsg);
    }
  }
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initGame3D();
} else {
  document.addEventListener('DOMContentLoaded', initGame3D);
}



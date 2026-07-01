// ============================================================
// AI.JS — Inteligencia Artificial para 3 jugadores (compañero + 2 rivales)
// ============================================================

const AI_MESSAGES = {
  partner: ['¡Voy yo!', '¡Tuya!', '¡Subimos!', '¡Defendemos!', '¡Bien!', '¡Dale!'],
  celebrate: ['¡GOLAZO!', '¡Increíble!', '¡Eso es!', '¡Vamos!'],
  mistake: ['¡Ey!', 'Tranquilo...', 'La próxima'],
};

// Perfiles de IA por dificultad
const AI_PROFILES = {
  easy: {
    reactionTime: 28,
    accuracy: 0.45,
    shotVariety: 0.25,
    positioningSkill: 0.35,
    errorRate: 0.25,
    maxSpeed: 2.4,
    anticipation: 0.2,
  },
  medium: {
    reactionTime: 16,
    accuracy: 0.68,
    shotVariety: 0.5,
    positioningSkill: 0.6,
    errorRate: 0.12,
    maxSpeed: 3.2,
    anticipation: 0.5,
  },
  hard: {
    reactionTime: 8,
    accuracy: 0.85,
    shotVariety: 0.75,
    positioningSkill: 0.85,
    errorRate: 0.05,
    maxSpeed: 4.0,
    anticipation: 0.75,
  },
};

class AIController {
  constructor(player, profile, court) {
    this.player = player;
    this.profile = AI_PROFILES[profile] || AI_PROFILES.medium;
    this.court = court;
    this.targetX = player.x;
    this.targetY = player.y;
    this.lastUpdate = 0;
    this.decisionTimer = 0;
    this.currentShotType = 'drive';
    this.state = 'idle'; // idle, move_to_ball, position, recover
    this.messageTimer = 0;
    this.player.speed = this.profile.maxSpeed;
  }

  update(ball, players, frame) {
    if (this.decisionTimer > 0) { this.decisionTimer--; return { targetX: this.targetX, targetY: this.targetY }; }
    this.decisionTimer = this.profile.reactionTime;

    const p = this.player;
    const isTeam0 = p.team === 0;
    const myHalfY = isTeam0
      ? { min: this.court.wallTop, max: this.court.netY }
      : { min: this.court.netY, max: this.court.wallBottom };

    const ballInMyHalf = isTeam0
      ? ball.y < this.court.netY
      : ball.y > this.court.netY;

    const ballComingToMe = isTeam0 ? ball.vy < 0 : ball.vy > 0;

    // ---- Anticipar posición de la pelota ----
    const anticipationFrames = 8 + (1 - this.profile.anticipation) * 20;
    const predictedBallX = ball.x + ball.vx * anticipationFrames;
    const predictedBallY = ball.y + ball.vy * anticipationFrames;

    // ---- Decidir si va a buscar la pelota ----
    const distToBall = Math.hypot(ball.x - p.x, ball.y - p.y);

    if (ballInMyHalf && ballComingToMe && distToBall < 280) {
      this.state = 'move_to_ball';

      // Añadir ruido en posicionamiento según habilidad
      const noise = (1 - this.profile.accuracy) * 40;
      this.targetX = predictedBallX + (Math.random() - 0.5) * noise;
      this.targetY = predictedBallY + (Math.random() - 0.5) * noise;

      // Clamp a mi mitad
      this.targetX = Math.max(this.court.wallLeft + 20, Math.min(this.court.wallRight - 20, this.targetX));
      this.targetY = Math.max(myHalfY.min + 20, Math.min(myHalfY.max - 20, this.targetY));
    } else {
      // Volver a posición de "T"
      this.state = 'recover';
      const tX = this.court.netX;
      const tY = isTeam0 ? myHalfY.min + (myHalfY.max - myHalfY.min) * 0.65
                         : myHalfY.min + (myHalfY.max - myHalfY.min) * 0.35;

      // Ajustar posición lateral según la pelota
      const lateralBias = (ball.x - this.court.netX) * this.profile.positioningSkill * 0.4;
      this.targetX = tX + lateralBias;
      this.targetY = tY;

      // Cubrir espacios: si hay compañero, separarse
      const partner = players.find(pl => pl.team === p.team && pl.id !== p.id);
      if (partner) {
        const sepX = (p.x - partner.x) * 0.1;
        this.targetX += sepX > 0 ? 20 : -20;
      }
    }

    return { targetX: this.targetX, targetY: this.targetY };
  }

  /** Decide si y cómo golpear la pelota */
  decideShotType(ball) {
    const p = this.player;
    const rand = Math.random();
    const isTeam0 = p.team === 0;

    const ballHighZ = ball.z > 40; // Bola alta
    const ballFront = isTeam0 ? ball.y < this.court.netY - 80 : ball.y > this.court.netY + 80;

    let shot;
    if (ballHighZ && ballFront && rand < this.profile.shotVariety) {
      shot = rand < 0.5 ? 'smash' : 'bandeja';
    } else if (ball.z > 30 && rand < this.profile.shotVariety * 0.7) {
      shot = 'lob';
    } else if (ballFront && rand < this.profile.shotVariety * 0.5) {
      shot = 'volley';
    } else if (rand < 0.5) {
      shot = 'drive';
    } else {
      shot = 'backhand';
    }

    // Error no forzado según dificultad
    if (Math.random() < this.profile.errorRate) {
      return null; // Fallo
    }

    return shot;
  }

  /** Obtiene el punto objetivo del golpe */
  getTargetPoint() {
    const p = this.player;
    const isTeam0 = p.team === 0;
    const targetHalfY = isTeam0
      ? { min: this.court.netY, max: this.court.wallBottom }
      : { min: this.court.wallTop, max: this.court.netY };

    const noise = (1 - this.profile.accuracy) * 80;
    const targetX = this.court.wallLeft + 20 + Math.random() * (this.court.wallRight - this.court.wallLeft - 40) + (Math.random() - 0.5) * noise;
    const targetY = targetHalfY.min + 20 + Math.random() * (targetHalfY.max - targetHalfY.min - 40) + (Math.random() - 0.5) * noise;

    return {
      x: Math.max(this.court.wallLeft + 15, Math.min(this.court.wallRight - 15, targetX)),
      y: Math.max(targetHalfY.min + 15, Math.min(targetHalfY.max - 15, targetY))
    };
  }

  shouldSendMessage(frame) {
    if (this.messageTimer > 0) { this.messageTimer--; return null; }
    if (Math.random() < 0.004) {
      this.messageTimer = 180;
      const msgs = AI_MESSAGES.partner;
      return msgs[Math.floor(Math.random() * msgs.length)];
    }
    return null;
  }
}

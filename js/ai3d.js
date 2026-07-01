// ============================================================
// AI3D.JS — Inteligencia Artificial para el modo 3D
// Coordenadas: X (-5 a +5), Z (-10 a +10), Y = altura
// Team 0 (jugador) en Z>0, Team 1 (rivales) en Z<0
// ============================================================

const AI3D_MESSAGES = {
  partner: ['¡Voy yo! 💪', '¡Tuya! 👋', '¡Subimos! ⬆️', '¡Defendemos! 🛡️', '¡Bien! 👏', '¡Dale! 🔥'],
  celebrate: ['¡GOLAZO! 🎉', '¡Increíble! ✨', '¡Eso es! 💥', '¡Vamos! 🚀'],
  mistake: ['Tranquilo... 😤', 'La próxima 💪', '¡Ey! 😠'],
};

// Perfiles de IA por dificultad (adaptado a 3D)
const AI3D_PROFILES = {
  easy: {
    reactionTime: 28,      // frames entre decisiones — más lento
    accuracy: 0.45,         // precisión de posicionamiento
    shotVariety: 0.25,      // probabilidad de golpes especiales
    positioningSkill: 0.35, // qué tan bien cubre la cancha
    errorRate: 0.22,        // probabilidad de error no forzado
    maxSpeed: 2.4,          // velocidad de movimiento — reducida
    anticipation: 0.2,      // anticipación de trayectoria
    hitRange: 1.4,          // rango de golpe (más fácil de pegarle)
  },
  medium: {
    reactionTime: 16,
    accuracy: 0.65,
    shotVariety: 0.5,
    positioningSkill: 0.6,
    errorRate: 0.12,
    maxSpeed: 3.2,
    anticipation: 0.45,
    hitRange: 1.2,
  },
  hard: {
    reactionTime: 8,
    accuracy: 0.82,
    shotVariety: 0.72,
    positioningSkill: 0.82,
    errorRate: 0.05,
    maxSpeed: 4.0,
    anticipation: 0.7,
    hitRange: 1.0,
  },
};

class AIController3D {
  constructor(playerData, difficulty) {
    this.player = playerData;
    this.profile = AI3D_PROFILES[difficulty] || AI3D_PROFILES.medium;
    this.difficulty = difficulty;
    this.targetX = playerData.startX;
    this.targetZ = playerData.startZ;
    this.decisionTimer = 0;
    this.messageTimer = 0;
    this.state = 'recover'; // 'move_to_ball', 'recover', 'idle'
  }

  /**
   * Actualiza la posición objetivo de la IA.
   * @param {Object} ballPos — {x, y, z} posición de la pelota (cannon-es)
   * @param {Object} ballVel — {x, y, z} velocidad de la pelota
   * @param {Array} allPlayers — array de todos los jugadores
   * @param {number} frame — frame actual
   * @returns {{ targetX, targetZ }} posición objetivo
   */
  update(ballPos, ballVel, allPlayers, frame) {
    // Temporizador de reacción
    if (this.decisionTimer > 0) {
      this.decisionTimer--;
      return { targetX: this.targetX, targetZ: this.targetZ };
    }
    this.decisionTimer = this.profile.reactionTime;

    const p = this.player;
    const isTeam0 = p.team === 0;

    // Límites de mi mitad
    const myHalfZ = isTeam0
      ? { min: 0.3, max: 9.8 }   // team 0: Z > 0
      : { min: -9.8, max: -0.3 }; // team 1: Z < 0

    // ¿La pelota está en mi mitad?
    const ballInMyHalf = isTeam0 ? ballPos.z > 0 : ballPos.z < 0;

    // ¿La pelota viene hacia mí?
    const ballComingToMe = isTeam0 ? ballVel.z > 0 : ballVel.z < 0;

    // Anticipar posición de la pelota
    const antFrames = 10 + (1 - this.profile.anticipation) * 25;
    const dt = antFrames / 60; // convertir frames a segundos
    const predictedX = ballPos.x + ballVel.x * dt;
    const predictedZ = ballPos.z + ballVel.z * dt;

    // Distancia a la pelota
    const dx = ballPos.x - p.mesh.position.x;
    const dz = ballPos.z - p.mesh.position.z;
    const distToBall = Math.sqrt(dx * dx + dz * dz);

    if (ballInMyHalf && ballComingToMe && distToBall < 8) {
      // ── Ir a buscar la pelota ──
      this.state = 'move_to_ball';

      // Ruido en posicionamiento según habilidad
      const noise = (1 - this.profile.accuracy) * 1.5;
      this.targetX = predictedX + (Math.random() - 0.5) * noise;
      this.targetZ = predictedZ + (Math.random() - 0.5) * noise;

      // Clamp a mi mitad
      this.targetX = Math.max(-4.3, Math.min(4.3, this.targetX));
      this.targetZ = Math.max(myHalfZ.min, Math.min(myHalfZ.max, this.targetZ));

    } else {
      // ── Volver a posición táctica (T) ──
      this.state = 'recover';

      // Posición base según team
      const baseZ = isTeam0
        ? myHalfZ.min + (myHalfZ.max - myHalfZ.min) * 0.35
        : myHalfZ.min + (myHalfZ.max - myHalfZ.min) * 0.65;

      // Sesgo lateral hacia la pelota
      const lateralBias = ballPos.x * this.profile.positioningSkill * 0.3;
      this.targetX = p.startX * 0.5 + lateralBias;
      this.targetZ = baseZ;

      // Separarse del compañero
      const partner = allPlayers.find(pl => pl.team === p.team && pl.id !== p.id);
      if (partner) {
        const sepX = p.mesh.position.x - partner.mesh.position.x;
        if (Math.abs(sepX) < 2) {
          this.targetX += sepX > 0 ? 0.8 : -0.8;
        }
      }

      // Clamp
      this.targetX = Math.max(-4.3, Math.min(4.3, this.targetX));
      this.targetZ = Math.max(myHalfZ.min, Math.min(myHalfZ.max, this.targetZ));
    }

    return { targetX: this.targetX, targetZ: this.targetZ };
  }

  /**
   * Mueve al jugador hacia su objetivo.
   * @param {number} dt — delta time en segundos
   */
  moveToTarget(dt) {
    const p = this.player;
    const dx = this.targetX - p.mesh.position.x;
    const dz = this.targetZ - p.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.05) return;

    const speed = this.profile.maxSpeed * dt;
    const moveAmount = Math.min(speed, dist);
    p.mesh.position.x += (dx / dist) * moveAmount;
    p.mesh.position.z += (dz / dist) * moveAmount;

    // Clamp final
    const isTeam0 = p.team === 0;
    if (isTeam0) {
      p.mesh.position.z = Math.max(0.3, Math.min(9.8, p.mesh.position.z));
    } else {
      p.mesh.position.z = Math.max(-9.8, Math.min(-0.3, p.mesh.position.z));
    }
    p.mesh.position.x = Math.max(-4.5, Math.min(4.5, p.mesh.position.x));
  }

  /**
   * Decide el tipo de golpe basado en la situación.
   * @param {Object} ballPos — posición de la pelota
   * @returns {string|null} tipo de golpe, o null si error no forzado
   */
  decideShotType(ballPos) {
    const rand = Math.random();
    const isTeam0 = this.player.team === 0;

    // Pelota alta (vy positivo o y alto)
    const ballHigh = ballPos.y > 1.8;
    // Pelota cerca de la red
    const ballNearNet = Math.abs(ballPos.z) < 3;

    let shot;

    if (ballHigh && rand < this.profile.shotVariety) {
      // Pelota alta → smash o bandeja
      shot = rand < this.profile.shotVariety * 0.5 ? 'smash' : 'bandeja';
    } else if (ballHigh && rand < this.profile.shotVariety * 0.7) {
      shot = 'lob';
    } else if (ballNearNet && rand < this.profile.shotVariety * 0.5) {
      shot = 'volley';
    } else if (rand < 0.5) {
      shot = 'drive';
    } else {
      shot = 'backhand';
    }

    // Error no forzado
    if (Math.random() < this.profile.errorRate) {
      return null; // Fallo
    }

    return shot;
  }

  /**
   * Calcula el punto objetivo del golpe (campo contrario).
   * @returns {{ x: number, z: number }}
   */
  getTargetPoint() {
    const isTeam0 = this.player.team === 0;
    const noise = (1 - this.profile.accuracy) * 3;

    // Apuntar al campo rival
    const targetX = (Math.random() - 0.5) * 8 + (Math.random() - 0.5) * noise;
    const targetZ = isTeam0
      ? -(2 + Math.random() * 7) + (Math.random() - 0.5) * noise
      : (2 + Math.random() * 7) + (Math.random() - 0.5) * noise;

    return {
      x: Math.max(-4.5, Math.min(4.5, targetX)),
      z: Math.max(-9.5, Math.min(9.5, targetZ)),
    };
  }

  /**
   * Verifica si el jugador puede golpear la pelota.
   * @param {Object} ballPos — posición de la pelota
   * @returns {boolean}
   */
  canHit(ballPos) {
    const p = this.player.mesh.position;
    const dx = ballPos.x - p.x;
    const dy = ballPos.y - 1.0; // Altura del jugador
    const dz = ballPos.z - p.z;
    const dist = Math.sqrt(dx * dx + dy * dy * 0.3 + dz * dz);
    return dist < this.profile.hitRange && ballPos.y < 2.8;
  }

  /**
   * ¿Debería enviar un mensaje al compañero?
   * @param {number} frame
   * @returns {string|null}
   */
  shouldSendMessage(frame) {
    if (this.messageTimer > 0) { this.messageTimer--; return null; }
    if (this.player.team !== 0) return null; // Solo el compañero habla
    if (Math.random() < 0.004) {
      this.messageTimer = 180;
      const msgs = AI3D_MESSAGES.partner;
      return msgs[Math.floor(Math.random() * msgs.length)];
    }
    return null;
  }
}

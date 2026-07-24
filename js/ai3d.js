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
    reactionTime: 6,      // Reacción ágil
    accuracy: 0.75,       // Precisión de posicionamiento
    shotVariety: 0.60,    // Golpes especiales
    positioningSkill: 0.70, // Cobertura de pista
    errorRate: 0.06,      // Pocos errores
    maxSpeed: 10.0,       // Velocidad rápida
    anticipation: 0.65,   // Anticipación
    hitRange: 2.0,        // Rango de golpeo ampliado
  },
  medium: {
    reactionTime: 2,      // Reacción casi instantánea
    accuracy: 0.88,
    shotVariety: 0.82,
    positioningSkill: 0.88,
    errorRate: 0.03,
    maxSpeed: 12.5,       // Velocidad alta
    anticipation: 0.85,
    hitRange: 2.2,
  },
  hard: {
    reactionTime: 1,      // Reacción instantánea (1 frame)
    accuracy: 0.98,
    shotVariety: 0.95,
    positioningSkill: 0.98,
    errorRate: 0.01,
    maxSpeed: 15.0,       // Velocidad máxima profesional
    anticipation: 0.95,
    hitRange: 2.5,
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
    if (this.decisionTimer > 0) {
      this.decisionTimer--;
      return { targetX: this.targetX, targetZ: this.targetZ };
    }
    this.decisionTimer = this.profile.reactionTime;

    const p = this.player;
    const isTeam0 = p.team === 0;

    // Inicializar y gestionar fatiga del jugador
    if (p.fatigue === undefined) p.fatigue = 0;
    if (this.state === 'move_to_ball') {
      p.fatigue = Math.min(100, p.fatigue + 0.4);
    } else {
      p.fatigue = Math.max(0, p.fatigue - 0.25);
    }

    // Dificultad adaptativa ajustada por fatiga
    const fatigueFactor = 1.0 - (p.fatigue / 100) * 0.18;
    this.profile.maxSpeed = (AI3D_PROFILES[this.difficulty] || AI3D_PROFILES.medium).maxSpeed * fatigueFactor;

    // Límites de mi mitad
    const myHalfZ = isTeam0
      ? { min: 0.3, max: 9.8 }
      : { min: -9.8, max: -0.3 };

    const ballInMyHalf = isTeam0 ? ballPos.z > 0 : ballPos.z < 0;
    const ballComingToMe = isTeam0 ? ballVel.z > 0 : ballVel.z < 0;

    // 1. Anticipación de Rebotes en Paredes de Cristal
    let predictedX = ballPos.x + ballVel.x * 0.3;
    let predictedZ = ballPos.z + ballVel.z * 0.3;

    if (predictedZ > 10) {
      predictedZ = 10 - (predictedZ - 10) * 0.85;
    } else if (predictedZ < -10) {
      predictedZ = -10 - (predictedZ + 10) * 0.85;
    }
    if (predictedX > 5) {
      predictedX = 5 - (predictedX - 5) * 0.85;
    } else if (predictedX < -5) {
      predictedX = -5 - (predictedX + 5) * 0.85;
    }

    const dx = ballPos.x - p.mesh.position.x;
    const dz = ballPos.z - p.mesh.position.z;
    const distToBall = Math.sqrt(dx * dx + dz * dz);

    // 2. Posicionamiento Colectivo y Táctico
    const partner = allPlayers.find(pl => pl.team === p.team && pl.id !== p.id);
    const partnerAtNet = partner ? (isTeam0 ? partner.mesh.position.z < 4.5 : partner.mesh.position.z > -4.5) : false;

    if (ballInMyHalf && ballComingToMe && distToBall < 8.5) {
      this.state = 'move_to_ball';

      const noise = (1 - this.profile.accuracy) * 1.1;
      this.targetX = predictedX + (Math.random() - 0.5) * noise;
      this.targetZ = predictedZ + (Math.random() - 0.5) * noise;

      // Comunicar intención de golpeo
      if (this.player.team === 0 && Math.random() < 0.08) {
        const msgBox = document.getElementById('ai-message');
        if (msgBox) {
          msgBox.textContent = "¡Voy yo! 🎾";
          msgBox.classList.add('visible');
          setTimeout(() => msgBox.classList.remove('visible'), 1200);
        }
      }
    } else {
      // Pareja profesional: Cobertura sincronizada
      this.state = partnerAtNet ? 'offensive' : 'defensive';

      if (this.state === 'offensive') {
        // Subir a bloquear voleas a la red
        this.targetZ = isTeam0 ? 2.5 : -2.5;
        this.targetX = p.startX * 0.6 + ballPos.x * 0.25;
      } else {
        // Defender en el fondo
        this.targetZ = isTeam0 ? 7.6 : -7.6;
        this.targetX = p.startX * 0.8 + ballPos.x * 0.2;
      }

      // Evitar colisión / Cruzamiento estúpido
      if (partner) {
        const sepX = p.mesh.position.x - partner.mesh.position.x;
        if (Math.abs(sepX) < 2.2) {
          this.targetX += sepX > 0 ? 0.9 : -0.9;
        }
      }
    }

    // Clamps
    this.targetX = Math.max(-4.3, Math.min(4.3, this.targetX));
    this.targetZ = Math.max(myHalfZ.min, Math.min(myHalfZ.max, this.targetZ));

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

window.AIController3D = AIController3D;

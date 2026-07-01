// ============================================================
// PHYSICS.JS — Motor de física 2D para pádel
// Vista cenital: X=ancho cancha, Y=largo cancha, Z=altura
// ============================================================

const PHYSICS = {
  gravity: 0.45,        // Gravedad en Z (altura) — más realista
  bounceCourt: 0.52,    // Coeficiente de rebote suelo — menos rebote
  bounceGlass: 0.60,    // Rebote en pared de vidrio — absorbido
  bounceMesh: 0.40,     // Rebote en reja — mucho más absorción
  airFriction: 0.988,   // Fricción del aire — más resistencia
  groundFriction: 0.80, // Fricción del suelo al rodar
  spinDecay: 0.90,      // Decaimiento de spin por frame
  minSpeed: 0.4,
};

class Ball {
  constructor(courtW, courtH) {
    this.courtW = courtW;
    this.courtH = courtH;
    this.reset();
  }

  reset(x, y) {
    this.x = x ?? this.courtW / 2;
    this.y = y ?? this.courtH / 2;
    this.z = 0;        // Altura sobre el suelo (px equivalentes)
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.spin = 0;     // -1=slice, 0=plano, 1=topspin
    this.active = false;
    this.inPlay = false;
    this.bounces = 0;  // Botes en la cancha rival
    this.lastHitTeam = -1;
    this.trail = [];
    this.speed = 0;
  }

  // Lanzar saque
  serve(fromX, fromY, targetX, targetY, power = 0.8) {
    this.x = fromX;
    this.y = fromY;
    this.z = 0;
    const dist = Math.hypot(targetX - fromX, targetY - fromY);
    const spd = 4 + power * 4;
    this.vx = ((targetX - fromX) / dist) * spd;
    this.vy = ((targetY - fromY) / dist) * spd;
    this.vz = 3 + power * 2; // Altura inicial — arco más bajo
    this.spin = 0;
    this.active = true;
    this.inPlay = true;
    this.bounces = 0;
    this.trail = [];
  }

  // Golpe del jugador
  hit(player, shotType, power, targetX, targetY) {
    const dist = Math.hypot(targetX - player.x, targetY - player.y);
    if (dist < 0.1) return;

    let spd, spin, vz;
    switch (shotType) {
      case 'drive':    spd = 5 + power * 3.5; spin = 0.3;   vz = 1.2; break;
      case 'backhand': spd = 4.5 + power * 3;  spin = -0.15; vz = 1.5; break;
      case 'volley':   spd = 5.5 + power * 3.5; spin = 0;    vz = 0.4; break;
      case 'lob':      spd = 3 + power * 2;   spin = -0.2;  vz = 6 + power * 2.5; break;
      case 'smash':    spd = 7 + power * 4;   spin = 0.4;   vz = -1;  break;
      case 'bandeja':  spd = 4 + power * 3;   spin = 0.2;   vz = 2;   break;
      case 'vibora':   spd = 6 + power * 3;   spin = 0.5;   vz = 0.6; break;
      default:         spd = 4.5 + power * 3;  spin = 0;     vz = 1.5;
    }

    this.vx = ((targetX - player.x) / dist) * spd;
    this.vy = ((targetY - player.y) / dist) * spd;
    this.vz = Math.max(vz, 0);
    this.spin = spin;
    this.lastHitTeam = player.team;
    this.active = true;
    this.bounces = 0;
    this.trail = [];
    this.speed = Math.hypot(this.vx, this.vy);
  }

  update(court) {
    if (!this.active) return null;

    // Trail
    this.trail.push({ x: this.x, y: this.y, z: this.z });
    if (this.trail.length > 14) this.trail.shift();

    // Mover
    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;
    this.vz -= PHYSICS.gravity;

    // Spin: afecta la trayectoria lateral levemente
    this.vx += this.spin * 0.03;
    this.spin *= PHYSICS.spinDecay;

    // Fricción del aire
    this.vx *= PHYSICS.airFriction;
    this.vy *= PHYSICS.airFriction;

    // Velocidad actual
    this.speed = Math.hypot(this.vx, this.vy) * 5.0; // km/h aprox (escalado visual)

    // ---- Bote en el suelo ----
    if (this.z <= 0) {
      this.z = 0;
      if (Math.abs(this.vz) > PHYSICS.minSpeed) {
        this.vz = -this.vz * PHYSICS.bounceCourt;
        // Aplicar spin al bote
        if (this.spin > 0) { this.vx *= 1.1; this.vy *= 1.1; } // topspin: acelera
        if (this.spin < 0) { this.vx *= 0.85; this.vy *= 0.85; } // slice: frena
        this.bounces++;
        return { type: 'bounce', x: this.x, y: this.y };
      } else {
        this.vz = 0;
        // Si está quieto en el suelo y viajando, fricción de suelo
        this.vx *= PHYSICS.groundFriction;
        this.vy *= PHYSICS.groundFriction;
        if (Math.hypot(this.vx, this.vy) < 0.25) {
          this.active = false;
          return { type: 'dead' };
        }
      }
    }

    // ---- Paredes laterales (vidrio) ----
    const wallL = court.wallLeft;
    const wallR = court.wallRight;
    const wallT = court.wallTop;
    const wallB = court.wallBottom;

    if (this.x - court.ballR < wallL) {
      this.x = wallL + court.ballR;
      this.vx = Math.abs(this.vx) * PHYSICS.bounceGlass;
      return { type: 'wall', wall: 'left', x: this.x, y: this.y };
    }
    if (this.x + court.ballR > wallR) {
      this.x = wallR - court.ballR;
      this.vx = -Math.abs(this.vx) * PHYSICS.bounceGlass;
      return { type: 'wall', wall: 'right', x: this.x, y: this.y };
    }

    // ---- Paredes fondo (vidrio + reja) ----
    if (this.y - court.ballR < wallT) {
      // Fondo campo equipo 0
      this.y = wallT + court.ballR;
      const coef = this.z > court.meshHeight ? PHYSICS.bounceMesh : PHYSICS.bounceGlass;
      this.vy = Math.abs(this.vy) * coef;
      return { type: 'wall', wall: 'top', x: this.x, y: this.y };
    }
    if (this.y + court.ballR > wallB) {
      // Fondo campo equipo 1
      this.y = wallB - court.ballR;
      const coef = this.z > court.meshHeight ? PHYSICS.bounceMesh : PHYSICS.bounceGlass;
      this.vy = -Math.abs(this.vy) * coef;
      return { type: 'wall', wall: 'bottom', x: this.x, y: this.y };
    }

    // ---- Red ----
    const netY = court.netY;
    const netH = court.netHeight; // altura de red en px
    if (Math.abs(this.y - netY) < court.ballR + 4 && this.z < netH) {
      // Toca la red
      if (this.vy > 0) {
        this.y = netY - court.ballR - 4;
        this.vy = -Math.abs(this.vy) * 0.3;
      } else {
        this.y = netY + court.ballR + 4;
        this.vy = Math.abs(this.vy) * 0.3;
      }
      return { type: 'net', x: this.x, y: this.y };
    }

    return null;
  }

  // Visual radius del sprite (más grande cuanta más altura)
  getVisualRadius(baseR) {
    return baseR + this.z * 0.08;
  }

  // Sombra en el suelo (indica altura)
  getShadowScale() {
    return Math.max(0.3, 1 - this.z * 0.02);
  }
}

class Player {
  constructor(id, team, x, y, isHuman, color, name) {
    this.id = id;
    this.team = team;
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.isHuman = isHuman;
    this.color = color;
    this.name = name;
    this.vx = 0;
    this.vy = 0;
    this.speed = 3.5;
    this.radius = 18;
    this.paddleAngle = 0;
    this.isSwinging = false;
    this.swingTimer = 0;
    this.lastShotType = 'drive';
    this.stamina = 100;
    this.staminaRegen = 0.08;
    // Para animación
    this.bobPhase = Math.random() * Math.PI * 2;
    this.trail = [];
  }

  resetPosition() {
    this.x = this.startX;
    this.y = this.startY;
    this.vx = 0;
    this.vy = 0;
  }

  update(targetX, targetY, court) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);

    const spd = this.speed * (0.5 + this.stamina / 200);

    if (dist > 2) {
      this.vx = (dx / dist) * Math.min(spd, dist);
      this.vy = (dy / dist) * Math.min(spd, dist);
    } else {
      this.vx *= 0.7;
      this.vy *= 0.7;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Limitar a zona de la cancha del equipo
    const margin = this.radius + 5;
    this.x = Math.max(court.wallLeft + margin, Math.min(court.wallRight - margin, this.x));
    this.y = Math.max(court.wallTop + margin, Math.min(court.wallBottom - margin, this.y));

    // Stamina
    if (dist > 2) {
      this.stamina = Math.max(0, this.stamina - 0.04);
    } else {
      this.stamina = Math.min(100, this.stamina + this.staminaRegen);
    }

    // Swing timer
    if (this.isSwinging) {
      this.swingTimer--;
      if (this.swingTimer <= 0) this.isSwinging = false;
    }

    this.bobPhase += 0.15;
  }

  canHitBall(ball) {
    const dist = Math.hypot(ball.x - this.x, ball.y - this.y);
    return dist < this.radius + ball.getVisualRadius(10) + 8 && !this.isSwinging;
  }

  swing(shotType = 'drive') {
    this.isSwinging = true;
    this.swingTimer = 18;
    this.lastShotType = shotType;
    this.paddleAngle = Math.atan2(this.vy, this.vx);
  }
}

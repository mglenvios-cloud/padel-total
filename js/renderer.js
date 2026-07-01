// ============================================================
// RENDERER.JS — Canvas 2D: dibuja cancha, jugadores, pelota y efectos
// ============================================================

class GameRenderer {
  constructor(canvas, court) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.court = court;
    this.particles = [];
    this.frame = 0;
    this.ripples = [];
  }

  resize() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }

  // ---- Partículas ----
  addParticles(x, y, color, count = 8, power = 1) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4 * power;
      this.particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, decay: 0.04 + Math.random() * 0.04, r: 3 + Math.random() * 4, color
      });
    }
  }

  addRipple(x, y, color) {
    this.ripples.push({ x, y, r: 5, maxR: 40, color, life: 1 });
  }

  _updateParticles() {
    this.particles = this.particles.filter(p => {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.12; // gravedad
      p.life -= p.decay;
      return p.life > 0;
    });
    this.ripples = this.ripples.filter(r => {
      r.r += 2.5; r.life -= 0.05;
      return r.life > 0;
    });
  }

  _drawParticles(ctx) {
    this.particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color + Math.floor(p.life * 255).toString(16).padStart(2, '0');
      ctx.fill();
    });
    this.ripples.forEach(r => {
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.strokeStyle = r.color + Math.floor(r.life * 180).toString(16).padStart(2, '0');
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  // ---- Cancha ----
  drawCourt() {
    const ctx = this.ctx;
    const c = this.court;
    const W = this.canvas.width, H = this.canvas.height;
    this.frame++;

    // Fondo oscuro
    ctx.fillStyle = '#0a1a0f';
    ctx.fillRect(0, 0, W, H);

    // Grid sutil
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Cancha base
    ctx.fillStyle = '#1a4a2a';
    ctx.beginPath();
    ctx.roundRect(c.wallLeft, c.wallTop, c.width, c.height, 4);
    ctx.fill();

    // Sombra interior cancha
    const grad = ctx.createRadialGradient(c.netX, c.netY, 0, c.netX, c.netY, c.height * 0.6);
    grad.addColorStop(0, 'rgba(255,255,255,0.04)');
    grad.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(c.wallLeft, c.wallTop, c.width, c.height, 4);
    ctx.fill();

    // ---- Paredes de vidrio ----
    // Laterales
    [[c.wallLeft - c.glassW, c.wallTop, c.glassW, c.height],
     [c.wallRight, c.wallTop, c.glassW, c.height]].forEach(([x, y, w, h]) => {
      const g = ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, 'rgba(100,200,255,0.25)');
      g.addColorStop(0.5, 'rgba(150,230,255,0.12)');
      g.addColorStop(1, 'rgba(100,200,255,0.25)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      // Marco
      ctx.strokeStyle = 'rgba(100,220,255,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
    });

    // Fondo (vidrio + reja según zona)
    [[c.wallLeft, c.wallTop - c.glassW, c.width, c.glassW],
     [c.wallLeft, c.wallBottom, c.width, c.glassW]].forEach(([x, y, w, h]) => {
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, 'rgba(100,200,255,0.2)');
      g.addColorStop(1, 'rgba(100,200,255,0.1)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      // Patrón reja
      ctx.strokeStyle = 'rgba(180,200,180,0.3)';
      ctx.lineWidth = 1;
      for (let gx = x; gx < x + w; gx += 8) {
        ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
      }
      for (let gy = y; gy < y + h; gy += 8) {
        ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(100,220,255,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
    });

    // ---- Líneas de cancha ----
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.wallLeft, c.wallTop, c.width, c.height);

    // Línea de saque izquierda y derecha
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    // Línea de saque horizontal (a 6.95m del fondo)
    ctx.beginPath(); ctx.moveTo(c.wallLeft, c.serveLineTop); ctx.lineTo(c.wallRight, c.serveLineTop); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(c.wallLeft, c.serveLineBot); ctx.lineTo(c.wallRight, c.serveLineBot); ctx.stroke();
    // Línea central vertical (solo en zona de saque)
    ctx.beginPath(); ctx.moveTo(c.netX, c.wallTop); ctx.lineTo(c.netX, c.serveLineTop); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(c.netX, c.serveLineBot); ctx.lineTo(c.netX, c.wallBottom); ctx.stroke();

    // ---- Red ----
    // Sombra red
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(c.wallLeft, c.netY - 1, c.width, 8);
    // Red
    const netGrad = ctx.createLinearGradient(0, c.netY - 3, 0, c.netY + 7);
    netGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
    netGrad.addColorStop(1, 'rgba(200,200,200,0.7)');
    ctx.fillStyle = netGrad;
    ctx.fillRect(c.wallLeft, c.netY - 3, c.width, 5);
    // Banda superior de la red
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(c.wallLeft, c.netY - 4, c.width, 2);
    // Malla de red (líneas verticales)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.5;
    for (let x = c.wallLeft; x < c.wallRight; x += 10) {
      ctx.beginPath(); ctx.moveTo(x, c.netY - c.netHeight); ctx.lineTo(x, c.netY + 2); ctx.stroke();
    }
    // Postes
    [c.wallLeft - 2, c.wallRight - 2].forEach(px => {
      ctx.fillStyle = 'rgba(200,200,200,0.9)';
      ctx.fillRect(px, c.netY - c.netHeight - 4, 4, c.netHeight + 8);
    });

    // ---- Logos en cancha (sutil) ----
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.font = 'bold 28px Rajdhani, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏓 PADEL CHAMPIONS', c.netX, c.wallTop + c.height * 0.25);
    ctx.fillText('🏓 PADEL CHAMPIONS', c.netX, c.wallTop + c.height * 0.75);
    ctx.restore();
  }

  // ---- Sombra pelota ----
  _drawBallShadow(ball) {
    const ctx = this.ctx;
    const shadowScale = ball.getShadowScale();
    const baseR = 9;
    ctx.beginPath();
    ctx.ellipse(ball.x, ball.y + baseR * 0.5, baseR * shadowScale * 1.4, baseR * shadowScale * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,${0.35 * shadowScale})`;
    ctx.fill();
  }

  // ---- Trail pelota ----
  _drawBallTrail(ball) {
    const ctx = this.ctx;
    ball.trail.forEach((pt, i) => {
      const t = (i + 1) / ball.trail.length;
      const r = 4 * t;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,220,60,${t * 0.35})`;
      ctx.fill();
    });
  }

  // ---- Pelota ----
  drawBall(ball) {
    const ctx = this.ctx;
    if (!ball.active) return;
    this._drawBallShadow(ball);
    this._drawBallTrail(ball);
    const r = ball.getVisualRadius(9);
    // Glow
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, r + 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,220,60,0.2)';
    ctx.fill();
    // Pelota
    const grad = ctx.createRadialGradient(ball.x - r * 0.3, ball.y - r * 0.3, r * 0.1, ball.x, ball.y, r);
    grad.addColorStop(0, '#fffde0');
    grad.addColorStop(0.4, '#f0d060');
    grad.addColorStop(1, '#c8a020');
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    // Línea de la pelota
    ctx.strokeStyle = 'rgba(180,140,20,0.6)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // ---- Jugador ----
  drawPlayer(player, isHuman) {
    const ctx = this.ctx;
    const bob = Math.sin(player.bobPhase) * 2;
    const px = player.x, py = player.y + bob;
    const r = player.radius;

    // Sombra
    ctx.beginPath();
    ctx.ellipse(px, py + r + 2, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fill();

    // Aura de selección (jugador humano)
    if (isHuman) {
      ctx.beginPath();
      ctx.arc(px, py, r + 6 + Math.sin(this.frame * 0.08) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = player.color + '55';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Cuerpo
    const bodyGrad = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, 1, px, py, r);
    bodyGrad.addColorStop(0, player.color + 'ff');
    bodyGrad.addColorStop(1, player.color + '99');
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inicial
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${r * 0.9}px Outfit, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.name[0].toUpperCase(), px, py);

    // Paleta
    const swingOffset = player.isSwinging ? Math.sin((18 - player.swingTimer) / 18 * Math.PI) * 12 : 0;
    const angle = player.team === 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
    ctx.save();
    ctx.translate(px + Math.cos(angle) * (r + 6 + swingOffset), py + Math.sin(angle) * (r + 4));
    ctx.rotate(angle + Math.PI / 4 + swingOffset * 0.1);
    // Mango
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-2, -10, 4, 10);
    // Paleta
    const paddleGrad = ctx.createLinearGradient(-7, -22, 7, -8);
    paddleGrad.addColorStop(0, player.color);
    paddleGrad.addColorStop(1, '#000');
    ctx.fillStyle = paddleGrad;
    ctx.beginPath();
    ctx.ellipse(0, -16, 7, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Barra de stamina
    const sw = r * 2, sh = 4;
    const sx = px - r, sy = py + r + 6;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(sx, sy, sw, sh);
    const stColor = player.stamina > 60 ? '#00ff87' : player.stamina > 30 ? '#ffd700' : '#ff3366';
    ctx.fillStyle = stColor;
    ctx.fillRect(sx, sy, sw * (player.stamina / 100), sh);

    // Efecto swing
    if (player.isSwinging) {
      const t = 1 - player.swingTimer / 18;
      ctx.beginPath();
      ctx.arc(px, py, r + 8 + t * 14, 0, Math.PI * 2);
      ctx.strokeStyle = player.color + Math.floor((1 - t) * 120).toString(16).padStart(2, '0');
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  // ---- Indicador de saque ----
  drawServeIndicator(servingPlayer, targetZone) {
    if (!targetZone) return;
    const ctx = this.ctx;
    const pulse = 0.5 + Math.sin(this.frame * 0.1) * 0.5;
    ctx.strokeStyle = `rgba(255,215,0,${0.4 + pulse * 0.4})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(targetZone.x, targetZone.y, targetZone.w, targetZone.h);
    ctx.setLineDash([]);

    // Línea punteada desde jugador al objetivo
    ctx.beginPath();
    ctx.moveTo(servingPlayer.x, servingPlayer.y);
    ctx.lineTo(targetZone.x + targetZone.w / 2, targetZone.y + targetZone.h / 2);
    ctx.strokeStyle = `rgba(255,215,0,${0.2 + pulse * 0.2})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ---- Zona de golpe activa ----
  drawHitZone(player, ball) {
    const dist = Math.hypot(ball.x - player.x, ball.y - player.y);
    const maxDist = player.radius + 24;
    if (dist < maxDist && ball.active) {
      const ctx = this.ctx;
      const t = 1 - dist / maxDist;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 10, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,212,255,${t * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // ---- Crowd / Público ----
  drawCrowd() {
    const ctx = this.ctx;
    const c = this.court;
    const W = this.canvas.width, H = this.canvas.height;

    // Arriba
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, c.wallTop - c.glassW);
    // Abajo
    ctx.fillRect(0, c.wallBottom + c.glassW, W, H - (c.wallBottom + c.glassW));

    // Siluetas de personas
    const t = this.frame;
    const crowdColors = ['#1a0a2e', '#0a1a3e', '#1a2a0e', '#2a0a1e', '#0a2a1e'];
    const topY = c.wallTop - c.glassW;
    const botY = c.wallBottom + c.glassW;

    for (let x = 20; x < W; x += 20) {
      const color = crowdColors[Math.floor(x / 20) % crowdColors.length];
      const bob = Math.sin(t * 0.05 + x * 0.3) * 3;
      // Top crowd
      if (topY > 20) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x, topY - 8 + bob, 7, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - 4, topY - 4, 8, 12);
      }
      // Bot crowd
      if (H - botY > 20) {
        ctx.beginPath();
        ctx.ellipse(x, botY + 18 - bob, 7, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x - 4, botY + 14, 8, 12);
      }
    }
  }

  // ---- Render completo ----
  render(ball, players, humanPlayer, serveState) {
    const ctx = this.ctx;

    // Dibujar crowd de fondo
    this.drawCrowd();
    // Cancha
    this.drawCourt();

    // Indicador zona de golpe
    if (humanPlayer && ball) {
      this.drawHitZone(humanPlayer, ball);
    }

    // Saque indicator
    if (serveState && serveState.active) {
      this.drawServeIndicator(players[serveState.playerIdx], serveState.targetZone);
    }

    // Pelota (sombra primero)
    if (ball) this.drawBall(ball);

    // Jugadores
    players.forEach(p => this.drawPlayer(p, humanPlayer && p.id === humanPlayer.id));

    // Partículas
    this._drawParticles(ctx);
    this._updateParticles();
  }
}

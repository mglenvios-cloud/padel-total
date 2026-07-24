/**
 * TVGraphics - Dibuja el HUD y los marcadores superpuestos de estilo televisión.
 */
class TVGraphics {
  constructor() {
    this.overlay = null;
    this.setupUI();
  }

  setupUI() {
    const div = document.createElement('div');
    div.id = 'tv-overlay-hud';
    div.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:999;background:linear-gradient(135deg, rgba(2,6,23,0.9), rgba(5,10,25,0.7));border:1px solid #00d4ff;color:#ffffff;padding:14px;border-radius:10px;font-family:Rajdhani, sans-serif;box-shadow:0 0 20px rgba(0,212,255,0.25);backdrop-filter:blur(8px);min-width:220px;pointer-events:none;';
    
    div.innerHTML = `
      <div style="font-size:10px;color:#00d4ff;letter-spacing:2px;font-weight:bold;margin-bottom:4px;">BROADCAST TV LIVE</div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span id="tv-player-card" style="font-weight:600;font-size:16px;">JUGADOR</span>
        <span id="tv-elo" style="color:#ffd700;font-size:11px;border:1px solid #ffd70044;padding:1px 6px;border-radius:4px;">ELO: 1500</span>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:6px;border-top:1px solid rgba(255,255,255,0.1);padding-top:6px;">
        VELOCIDAD DE BOLA: <span id="tv-ball-speed" style="color:#00ff87;font-weight:bold;">0 km/h</span>
      </div>
    `;

    document.body.appendChild(div);
    this.overlay = div;
  }

  update(speedKmh, playerName, elo = 1500) {
    if (!this.overlay) return;

    document.getElementById('tv-player-card').textContent = playerName.toUpperCase();
    document.getElementById('tv-elo').textContent = `ELO: ${elo}`;
    document.getElementById('tv-ball-speed').textContent = `${Math.round(speedKmh)} km/h`;
  }
}

window.TVGraphics = TVGraphics;

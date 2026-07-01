// ============================================================
// UI.JS — HUD broadcast, marcador, mensajes IA, indicadores
// ============================================================

class GameUI {
  constructor(scoring, mode) {
    this.scoring = scoring;
    this.mode = mode;
    this.clockSeconds = 0;
    this.clockInterval = null;
    this.messageTimeout = null;
    this.audioEnabled = true;
    this._startClock();
  }

  _startClock() {
    this.clockInterval = setInterval(() => { this.clockSeconds++; }, 1000);
  }

  _formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /** Actualiza el marcador en el HUD */
  updateScoreboard(team0Name, team1Name, team0Players, team1Players) {
    const sc = this.scoring;

    // Puntos del juego actual
    document.getElementById('score-game-0').textContent = sc.getScoreString().split(' - ')[0];
    document.getElementById('score-game-1').textContent = sc.getScoreString().split(' - ')[1];

    // Juegos del set
    document.getElementById('score-sets-0').textContent = sc.setGames[0];
    document.getElementById('score-sets-1').textContent = sc.setGames[1];

    // Sets ganados (dots)
    this._updateSetDots(0, sc.sets[0]);
    this._updateSetDots(1, sc.sets[1]);

    // Clock
    const clockEl = document.getElementById('match-clock');
    if (clockEl) clockEl.textContent = this._formatTime(this.clockSeconds);

    // Set indicator
    const setEl = document.getElementById('set-indicator');
    if (setEl) setEl.textContent = sc.isTiebreak ? 'TIEBREAK' : `SET ${sc.currentSet}`;
  }

  _updateSetDots(team, setsWon) {
    const container = document.getElementById(`set-dots-${team}`);
    if (!container) return;
    const dots = container.querySelectorAll('.set-dot');
    dots.forEach((d, i) => {
      d.classList.remove('won', 'lost');
      if (i < setsWon) d.classList.add('won');
      else d.classList.add('lost');
    });
  }

  /** Muestra punto ganado con animación */
  showPointAlert(team, text, color) {
    const el = document.getElementById('point-alert');
    if (!el) return;
    el.textContent = text || (team === 0 ? '¡PUNTO! 🎯' : '¡PUNTO RIVAL!');
    el.style.color = color || (team === 0 ? '#00d4ff' : '#ff6b35');
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1800);
  }

  /** Muestra mensaje del compañero IA */
  showAIMessage(msg) {
    const el = document.getElementById('ai-message');
    if (!el) return;
    el.textContent = `🤖 ${msg}`;
    el.classList.add('visible');
    clearTimeout(this.messageTimeout);
    this.messageTimeout = setTimeout(() => el.classList.remove('visible'), 2500);
  }

  /** Indicador de potencia */
  updatePowerBar(power, isCharging) {
    const container = document.getElementById('power-bar-container');
    const fill = document.getElementById('power-bar-fill');
    const label = document.getElementById('power-label');
    if (!container || !fill) return;

    if (isCharging && power > 0.05) {
      container.classList.add('active');
      fill.style.width = (power * 100) + '%';
      const pct = Math.round(power * 100);
      if (label) label.textContent = pct < 40 ? '🟢 SUAVE' : pct < 75 ? '🟡 MEDIO' : '🔴 POTENCIA';
    } else {
      container.classList.remove('active');
    }
  }

  /** Indicador de velocidad de la pelota */
  updateSpeedMeter(speed) {
    const el = document.getElementById('speed-value');
    if (el) el.textContent = Math.round(speed);
  }

  /** Indicador de saque */
  showServeIndicator(attempt) {
    const el = document.getElementById('serve-indicator');
    if (!el) return;
    el.textContent = attempt === 1 ? '🟡 PRIMER SAQUE — Presiona ESPACIO para sacar' : '🔴 SEGUNDO SAQUE — ¡Cuidado!';
    el.style.display = 'block';
  }

  hideServeIndicator() {
    const el = document.getElementById('serve-indicator');
    if (el) el.style.display = 'none';
  }

  /** Estadísticas de entrenamiento */
  updateTrainingStats(stats) {
    const el = document.getElementById('training-overlay');
    if (!el) return;
    el.classList.add('active');
    el.innerHTML = `
      <div class="training-stat"><span>Golpes:</span><span class="training-val">${stats.hits}</span></div>
      <div class="training-stat"><span>Racha:</span><span class="training-val">${stats.streak}</span></div>
      <div class="training-stat"><span>Mejor racha:</span><span class="training-val">${stats.bestStreak}</span></div>
      <div class="training-stat"><span>Globos:</span><span class="training-val">${stats.lobs}</span></div>
      <div class="training-stat"><span>Remates:</span><span class="training-val">${stats.smashes}</span></div>
    `;
  }

  /** Pantalla de resultado final */
  showMatchResult(won, scoring, profile) {
    const el = document.getElementById('match-result');
    if (!el) return;

    const { ratingChange } = DataManager.recordMatch(
      won,
      scoring.sets,
      `${scoring.sets[0]}`,
      `${scoring.sets[1]}`,
      this.mode
    );

    const newProfile = DataManager.getProfile();

    el.innerHTML = `
      <div class="result-title" style="color:${won ? '#00ff87' : '#ff3366'}">
        ${won ? '🏆 VICTORIA' : '💀 DERROTA'}
      </div>
      <div class="result-score">${scoring.sets[0]} — ${scoring.sets[1]} sets</div>
      <div class="result-stats">
        <div class="result-stat">
          <div class="result-stat-val" style="color:#00d4ff">${scoring.stats.winners[0]}</div>
          <div class="result-stat-lbl">Winners</div>
        </div>
        <div class="result-stat">
          <div class="result-stat-val" style="color:#ff3366">${scoring.stats.errors[0]}</div>
          <div class="result-stat-lbl">Errores</div>
        </div>
        <div class="result-stat">
          <div class="result-stat-val" style="color:#ffd700">${scoring.stats.aces[0]}</div>
          <div class="result-stat-lbl">Aces</div>
        </div>
        <div class="result-stat">
          <div class="result-stat-val" style="color:#00ff87">${Math.floor(this.clockSeconds / 60)}m</div>
          <div class="result-stat-lbl">Duración</div>
        </div>
      </div>
      <div class="result-elo" style="background:rgba(${won ? '0,255,135' : '255,51,102'},0.1);
        border:1px solid rgba(${won ? '0,255,135' : '255,51,102'},0.3);
        color:${won ? '#00ff87' : '#ff3366'}">
        ELO: ${ratingChange > 0 ? '+' : ''}${ratingChange} → ${newProfile.rating}
      </div>
      <div class="result-actions">
        <button class="pause-btn pause-btn-primary" onclick="location.href=(location.pathname.includes('game3d')?'game3d.html':'game.html')+location.search">
          🔄 Revancha
        </button>
        <button class="pause-btn pause-btn-secondary" onclick="location.href='index.html'">
          🏠 Menú
        </button>
      </div>
    `;
    el.classList.add('active');

    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  destroy() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.messageTimeout) clearTimeout(this.messageTimeout);
  }
}

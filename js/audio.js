// ============================================================
// AUDIO.JS — Sonidos procedurales con Web Audio API
// ============================================================

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this._init();
  }

  _init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.enabled = false;
    }
  }

  _resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  /** Genera un sonido de golpe de paleta */
  playHit(power = 0.7, type = 'drive') {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freqs = { drive: 320, backhand: 280, volley: 400, smash: 180, lob: 240, bandeja: 300, vibora: 380 };
    const freq = freqs[type] || 300;

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq + power * 80, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.12);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3 + power * 0.3, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.start(t);
    osc.stop(t + 0.2);

    // Chasquido de paleta
    this._playNoise(0.04, 0.15 + power * 0.1);
  }

  /** Rebote en suelo */
  playBounce(height = 0) {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200 - height * 2, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t); osc.stop(t + 0.22);
  }

  /** Rebote en pared de vidrio */
  playWall() {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.start(t); osc.stop(t + 0.28);
  }

  /** Toca la red */
  playNet() {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    this._playNoise(0.15, 0.08);
  }

  /** Punto ganado */
  playPoint(won) {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t = this.ctx.currentTime;
    const notes = won ? [440, 554, 659, 880] : [330, 277, 220];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, t + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.18);
      osc.start(t + i * 0.12); osc.stop(t + i * 0.12 + 0.2);
    });
  }

  /** Juego / Set ganado */
  playGameWon() {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t = this.ctx.currentTime;
    [440, 494, 554, 659, 880].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.25, t + i * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.25);
      osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.3);
    });
  }

  /** Ruido de fondo (crowd, ambience) */
  _playNoise(duration, vol = 0.1) {
    if (!this.ctx) return;
    const bufLen = this.ctx.sampleRate * duration;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    src.buffer = buf;
    src.connect(gain); gain.connect(this.ctx.destination);
    gain.gain.value = vol;
    src.start(); src.stop(this.ctx.currentTime + duration);
  }

  toggle() { this.enabled = !this.enabled; return this.enabled; }
}

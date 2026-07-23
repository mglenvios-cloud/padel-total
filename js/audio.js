// ============================================================
// AUDIO.JS — Sonidos procedurales con Web Audio API
// ============================================================

// ============================================================
// AUDIO.JS — Sonidos 3D Espaciales con Web Audio API (HRTF Panning)
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
      if (this.ctx.listener) {
        if (this.ctx.listener.positionX) {
          this.ctx.listener.positionX.setValueAtTime(0, this.ctx.currentTime);
          this.ctx.listener.positionY.setValueAtTime(1.6, this.ctx.currentTime);
          this.ctx.listener.positionZ.setValueAtTime(0, this.ctx.currentTime);
        } else {
          this.ctx.listener.setPosition(0, 1.6, 0);
        }
      }
    } catch (e) {
      this.enabled = false;
    }
  }

  _resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  _createSpatialNode(x = 0, z = 0) {
    if (!this.ctx) return null;
    if (this.ctx.createPanner) {
      const panner = this.ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1.8;
      panner.maxDistance = 50;
      panner.rolloffFactor = 1.0;
      
      panner.positionX.setValueAtTime(x, this.ctx.currentTime);
      panner.positionY.setValueAtTime(0.5, this.ctx.currentTime);
      panner.positionZ.setValueAtTime(z, this.ctx.currentTime);
      
      panner.connect(this.ctx.destination);
      return panner;
    }
    return this.ctx.destination;
  }

  playHit(power = 0.7, type = 'drive', x = 0, z = 0) {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this._createSpatialNode(x, z);

    const freqs = { drive: 320, backhand: 280, volley: 400, smash: 180, lob: 240, bandeja: 300, vibora: 380 };
    const freq = freqs[type] || 300;

    osc.connect(gain);
    if (panner) gain.connect(panner);
    else gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq + power * 80, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.12);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3 + power * 0.3, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.start(t);
    osc.stop(t + 0.2);

    this._playNoise(0.04, 0.15 + power * 0.1, x, z);
  }

  playBounce(height = 0, x = 0, z = 0) {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this._createSpatialNode(x, z);

    osc.connect(gain);
    if (panner) gain.connect(panner);
    else gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200 - height * 2, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t); osc.stop(t + 0.22);
  }

  playWall(x = 0, z = 0) {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this._createSpatialNode(x, z);

    osc.connect(gain);
    if (panner) gain.connect(panner);
    else gain.connect(this.ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(550, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.2);
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.start(t); osc.stop(t + 0.28);
  }

  playNet(x = 0, z = 0) {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    this._playNoise(0.15, 0.08, x, z);
  }

  playStep(x = 0, z = 0) {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this._createSpatialNode(x, z);

    osc.connect(gain);
    if (panner) gain.connect(panner);
    else gain.connect(this.ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(30, t + 0.05);
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.start(t); osc.stop(t + 0.08);
  }

  playBreath(x = 0, z = 0) {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this._createSpatialNode(x, z);

    osc.connect(gain);
    if (panner) gain.connect(panner);
    else gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.linearRampToValueAtTime(115, t + 0.25);
    gain.gain.setValueAtTime(0.015, t);
    gain.gain.linearRampToValueAtTime(0.03, t + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    osc.start(t); osc.stop(t + 0.35);
  }

  playCrowdCheer() {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    this._playNoise(2.2, 0.22);
  }

  playCrowdClap() {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t = this.ctx.currentTime;
    for (let i = 0; i < 9; i++) {
      const snapTime = t + i * 0.12 + Math.random() * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, snapTime);
      gain.gain.setValueAtTime(0.08, snapTime);
      gain.gain.exponentialRampToValueAtTime(0.001, snapTime + 0.035);
      osc.start(snapTime);
      osc.stop(snapTime + 0.045);
    }
  }

  playRefereeCall(text = 'out') {
    if (!this.enabled || !this.ctx) return;
    this._resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this._createSpatialNode(-5.4, -0.5);

    osc.connect(gain);
    if (panner) gain.connect(panner);
    else gain.connect(this.ctx.destination);

    osc.type = 'sine';
    if (text === 'out') {
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.linearRampToValueAtTime(250, t + 0.25);
    } else {
      osc.frequency.setValueAtTime(270, t);
      osc.frequency.linearRampToValueAtTime(360, t + 0.22);
    }
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t); osc.stop(t + 0.35);
  }

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

  _playNoise(duration, vol = 0.1, x = 0, z = 0) {
    if (!this.ctx) return;
    const bufLen = this.ctx.sampleRate * duration;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const panner = (x !== 0 || z !== 0) ? this._createSpatialNode(x, z) : null;

    src.buffer = buf;
    src.connect(gain);
    if (panner) gain.connect(panner);
    else gain.connect(this.ctx.destination);
    
    gain.gain.value = vol;
    src.start(); src.stop(this.ctx.currentTime + duration);
  }

  toggle() { this.enabled = !this.enabled; return this.enabled; }
}

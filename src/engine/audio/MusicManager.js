/**
 * MusicManager - Modula la intensidad de la música de fondo según el estado de la partida.
 */
class MusicManager {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.gain = null;
    this.osc = null;
    this.isPlaying = false;
    this.setupSynth();
  }

  setupSynth() {
    if (!this.ctx) return;
    this.gain = this.ctx.createGain();
    this.gain.gain.setValueAtTime(0.005, this.ctx.currentTime); // Volumen sutil de fondo
    this.gain.connect(this.ctx.destination);
  }

  /**
   * Sintetiza una melodía minimalista de fondo.
   */
  startAmbientMusic() {
    if (!this.ctx || this.isPlaying) return;
    this.isPlaying = true;
    this._playBeat();
  }

  _playBeat() {
    if (!this.isPlaying) return;

    const osc = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    osc.type = 'triangle';
    // Nota grave repetitiva de bajo
    osc.frequency.setValueAtTime(55, this.ctx.currentTime); 

    noteGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.6);

    osc.connect(noteGain);
    noteGain.connect(this.gain);

    osc.start();
    osc.stop(this.ctx.currentTime + 1.6);

    // Bucle infinito de beat minimalista cada 2 segundos
    this.timeout = setTimeout(() => this._playBeat(), 2000);
  }

  stopAmbientMusic() {
    this.isPlaying = false;
    if (this.timeout) clearTimeout(this.timeout);
  }
}

window.MusicManager = MusicManager;

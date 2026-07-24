/**
 * AudioPool - Cache y reciclaje de osciladores o elementos de audio para optimización.
 */
class AudioPool {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.pool = [];
    this.maxSize = 24;
  }

  /**
   * Obtiene o genera una fuente de sonido limpia para sintetizar efectos.
   */
  getOscillator(type = 'sine') {
    if (!this.ctx) return null;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.connect(gain);

    return { osc, gain };
  }
}

window.AudioPool = AudioPool;

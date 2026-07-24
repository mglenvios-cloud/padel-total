/**
 * ImpactAudio - Genera sonidos dinámicos para impactos de pelota y palas.
 */
class ImpactAudio {
  constructor(audioContext) {
    this.ctx = audioContext;
  }

  /**
   * Genera el sonido de impacto/raquetazo (pop de frecuencia modulada).
   */
  playHit(power = 0.5, type = 'drive') {
    if (!this.ctx || this.ctx.state === 'suspended') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    
    // Configurar tono según tipo de golpe
    let startFreq = 220;
    let endFreq = 60;
    let duration = 0.12;

    if (type === 'smash') {
      startFreq = 340;
      endFreq = 80;
      duration = 0.22;
    } else if (type === 'lob') {
      startFreq = 180;
      endFreq = 50;
      duration = 0.1;
    }

    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);

    gain.gain.setValueAtTime(power * 0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
}

window.ImpactAudio = ImpactAudio;

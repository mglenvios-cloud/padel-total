/**
 * CrowdAudio - Genera y modula ruido ambiente y aplausos reactivos del público.
 */
class CrowdAudio {
  constructor(audioContext) {
    this.ctx = audioContext;
  }

  /**
   * Genera un silbido de aplauso procedural.
   */
  cheer(intensity = 0.5) {
    if (!this.ctx) return;

    // Detener si el contexto está pausado para no acumular nodos en espera
    if (this.ctx.state === 'suspended') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    // Modulación de frecuencia para simular voces/silbidos
    osc.frequency.setValueAtTime(800 + Math.random() * 400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 1.2);

    gain.gain.setValueAtTime(intensity * 0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);
  }
}

window.CrowdAudio = CrowdAudio;

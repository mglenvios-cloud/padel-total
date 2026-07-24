// ============================================================
// AUDIO.JS — Fachada compatible con la versión anterior
// Redirige llamadas hacia el motor AAA Immersive Audio System
// ============================================================

class AudioEngine {
  constructor() {
    this.manager = new AudioManager();
    this.enabled = true;
  }

  playHit(power = 0.7, type = 'drive', x = 0, z = 0) {
    if (!this.enabled) return;
    this.manager.playHit(power, type);
    this.manager.cheer(0.12);
  }

  playBounce(height = 0, x = 0, z = 0) {
    if (!this.enabled) return;
    this.manager.playBounce(0.5);
  }

  playWall(x = 0, z = 0) {
    if (!this.enabled) return;
    this.manager.playWall();
  }

  playNet(x = 0, z = 0) {
    if (!this.enabled) return;
    this.manager.playNet();
  }

  playStep(x = 0, z = 0) {
    if (!this.enabled) return;
    this.manager.playStep(x, z);
  }

  playBreath(x = 0, z = 0) {
    if (!this.enabled) return;
    this.manager.playBreath();
  }

  playCrowdCheer() {
    if (!this.enabled) return;
    this.manager.cheer(0.85);
  }

  playCrowdClap() {
    if (!this.enabled) return;
    this.manager.cheer(0.45);
  }

  playRefereeCall(text = 'out') {
    if (!this.enabled) return;
    if (this.manager.commentator) {
      this.manager.commentator.speak(text === 'out' ? '¡Mala!' : '¡Buena!');
    }
  }

  playPoint(won) {
    if (!this.enabled) return;
    if (this.manager.commentator) {
      this.manager.commentator.speak(won ? '¡Gran punto ganado!' : 'Punto para el rival.');
    }
  }

  playGameWon() {
    if (!this.enabled) return;
    if (this.manager.commentator) {
      this.manager.commentator.speak('¡Juego, set y partido!');
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

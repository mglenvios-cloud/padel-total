// ============================================================
// AUDIO.JS — Fachada compatible con la versión anterior
// Redirige llamadas hacia el motor AAA Immersive Audio System
// ============================================================

class AudioEngine {
  constructor() {
    try { this.manager = new AudioManager(); } catch(e) { this.manager = { playHit(){}, playBounce(){}, playWall(){}, playNet(){}, playStep(){}, playBreath(){}, cheer(){} }; }
    this.enabled = true;
  }

  playHit(power = 0.7, type = 'drive', x = 0, z = 0) {
    if (!this.enabled || !this.manager) return;
    try { this.manager.playHit(power, type); } catch(e){}
    try { this.manager.cheer(0.12); } catch(e){}
  }

  playBounce(height = 0, x = 0, z = 0) {
    if (!this.enabled || !this.manager) return;
    try { this.manager.playBounce(0.5); } catch(e){}
  }

  playWall(x = 0, z = 0) {
    if (!this.enabled || !this.manager) return;
    try { this.manager.playWall(); } catch(e){}
  }

  playNet(x = 0, z = 0) {
    if (!this.enabled || !this.manager) return;
    try { this.manager.playNet(); } catch(e){}
  }

  playStep(x = 0, z = 0) {
    if (!this.enabled || !this.manager) return;
    try { this.manager.playStep(x, z); } catch(e){}
  }

  playBreath(x = 0, z = 0) {
    if (!this.enabled || !this.manager) return;
    try { this.manager.playBreath(); } catch(e){}
  }

  playCrowdCheer() {
    if (!this.enabled || !this.manager) return;
    try { this.manager.cheer(0.85); } catch(e){}
  }

  playCrowdClap() {
    if (!this.enabled || !this.manager) return;
    try { this.manager.cheer(0.45); } catch(e){}
  }

  playRefereeCall(text = 'out') {
    if (!this.enabled || !this.manager) return;
    try {
      if (this.manager.commentator) {
        this.manager.commentator.speak(text === 'out' ? '¡Mala!' : '¡Buena!');
      }
    } catch(e){}
  }

  playPoint(won) {
    if (!this.enabled || !this.manager) return;
    try {
      if (this.manager.commentator) {
        this.manager.commentator.speak(won ? '¡Gran punto ganado!' : 'Punto para el rival.');
      }
    } catch(e){}
  }

  playGameWon() {
    if (!this.enabled || !this.manager) return;
    try {
      if (this.manager.commentator) {
        this.manager.commentator.speak('¡Juego, set y partido!');
      }
    } catch(e){}
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

window.AudioEngine = AudioEngine;

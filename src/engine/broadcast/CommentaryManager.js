/**
 * CommentaryManager - Genera locuciones automáticas procedurales tipo comentaristas de TV.
 */
class CommentaryManager {
  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.enabled = ('speechSynthesis' in window);
  }

  speak(text) {
    if (!this.enabled) {
      console.log(`Comentarista: "${text}"`);
      return;
    }

    // Detener audio anterior para que no se superpongan frases rápidamente
    this.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.15; // Velocidad de locución de transmisión
    this.speechSynthesis.speak(utterance);
  }

  narrateHit(shotType, playerName) {
    const Phrases = [
      `¡Gran golpe de ${playerName} con un ${shotType}!`,
      `¡Ataca ${playerName} buscando profundidad!`,
      `¡Increíble la defensa de ${playerName}!`,
      `¡Qué ${shotType} acaba de jugar!`
    ];
    const text = Phrases[Math.floor(Math.random() * Phrases.length)];
    this.speak(text);
  }
}

window.CommentaryManager = CommentaryManager;

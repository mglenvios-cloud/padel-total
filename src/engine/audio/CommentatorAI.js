/**
 * CommentatorAI - Comentarista del partido impulsado por síntesis de voz Web Speech API.
 */
class CommentatorAI {
  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.enabled = ('speechSynthesis' in window);
  }

  speak(text) {
    if (!this.enabled || this.speechSynthesis.speaking) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.1; // Ritmo deportivo fluido
    this.speechSynthesis.speak(utterance);
  }

  narratePoints(scoreTeam0, scoreTeam1) {
    const text = `El marcador se coloca en ${scoreTeam0} a ${scoreTeam1}`;
    this.speak(text);
  }
}

window.CommentatorAI = CommentatorAI;

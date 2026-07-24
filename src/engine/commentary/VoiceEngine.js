/**
 * VoiceEngine - Motor de síntesis de voz que configura y reproduce frases con emoción.
 */
class VoiceEngine {
  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.enabled = ('speechSynthesis' in window);
    this.pitch = 1.0;
    this.rate = 1.15; // Velocidad fluida deportiva
  }

  speak(text, emotion = 'normal') {
    if (!this.enabled) {
      console.log(`Locución: "${text}" [Emoción: ${emotion}]`);
      return;
    }

    // Cancelar diálogos anteriores
    this.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    
    // Adaptar tono y velocidad según emoción
    if (emotion === 'excited') {
      utterance.pitch = 1.25;
      utterance.rate = 1.25;
    } else {
      utterance.pitch = this.pitch;
      utterance.rate = this.rate;
    }

    this.speechSynthesis.speak(utterance);
  }
}

window.VoiceEngine = VoiceEngine;

/**
 * EventDetector - Clasifica los hitos del partido (smash ganador, punto largo, break point).
 */
class EventDetector {
  constructor() {}

  detectEvent(ballSpeed, rallyLength, playState) {
    if (playState === 'rally' && ballSpeed > 80) {
      return { type: 'smash', emotion: 'excited', text: '¡Vaya cañonazo por arriba!' };
    }
    if (rallyLength > 15) {
      return { type: 'long_rally', emotion: 'excited', text: '¡Un peloteo espectacular, qué resistencia!' };
    }
    return null;
  }
}

window.EventDetector = EventDetector;

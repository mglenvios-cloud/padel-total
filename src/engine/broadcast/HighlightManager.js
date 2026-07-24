/**
 * HighlightManager - Detecta jugadas destacadas (Smashes, rallies largos).
 */
class HighlightManager {
  constructor() {
    this.highlights = [];
  }

  detectHighlight(rallyLength, shotType, ballSpeed) {
    let type = '';
    
    if (shotType === 'smash' && ballSpeed > 80) {
      type = '🔥 SMASH POTENTE';
    } else if (rallyLength > 12) {
      type = '⭐ PUNTO LARGO';
    }

    if (type) {
      this.highlights.push({ type, time: Date.now() });
      console.log(`HighlightManager: Jugada destacada detectada -> ${type}`);
      return type;
    }
    return null;
  }
}

window.HighlightManager = HighlightManager;

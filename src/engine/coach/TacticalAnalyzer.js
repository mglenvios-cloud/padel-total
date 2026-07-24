/**
 * TacticalAnalyzer - Analiza patrones de juego y posicionamiento (ataque, red, defensa).
 */
class TacticalAnalyzer {
  constructor() {
    this.playStyleTrend = { attack: 0, defense: 0 };
  }

  analyzePosition(playerPos) {
    if (!playerPos) return;

    if (playerPos.z < 3.0) {
      // Cerca de la red
      this.playStyleTrend.attack += 0.05;
    } else {
      this.playStyleTrend.defense += 0.05;
    }
  }
}

window.TacticalAnalyzer = TacticalAnalyzer;

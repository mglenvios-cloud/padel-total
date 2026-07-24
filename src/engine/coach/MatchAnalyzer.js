/**
 * MatchAnalyzer - Registra estadísticas de golpes, errores y desplazamientos en partido.
 */
class MatchAnalyzer {
  constructor() {
    this.hits = [];
    this.winners = 0;
    this.unforcedErrors = 0;
    this.distanceCovered = 0;
  }

  logHit(playerName, shotType, velocity) {
    this.hits.push({ playerName, shotType, speed: velocity ? velocity.length() * 3.6 : 0, time: Date.now() });
    console.log(`Analizador: Golpe registrado de ${playerName} -> ${shotType}`);
  }

  logWinner() {
    this.winners++;
  }

  logUnforcedError() {
    this.unforcedErrors++;
  }
}

window.MatchAnalyzer = MatchAnalyzer;

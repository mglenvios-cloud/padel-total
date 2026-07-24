/**
 * AnalyticsManager - Registro comercial de partidas jugadas, usuarios y tiempo de juego.
 */
class AnalyticsManager {
  constructor() {
    this.sessionStart = Date.now();
  }

  logMatchEnd(tournamentName, won) {
    const elapsedSec = Math.round((Date.now() - this.sessionStart) / 1000);
    console.log(`Analítica: Partida finalizada en '${tournamentName}' (Resultado: ${won ? 'Victoria' : 'Derrota'}). Tiempo sesión: ${elapsedSec}s`);
  }
}

window.AnalyticsManager = AnalyticsManager;

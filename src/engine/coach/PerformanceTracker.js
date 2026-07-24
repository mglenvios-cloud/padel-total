/**
 * PerformanceTracker - Historial de estadísticas globales y evolución de rendimiento del jugador.
 */
class PerformanceTracker {
  constructor() {
    this.history = [];
  }

  recordMatchResult(matchId, winStatus, winnersCount, unforcedErrorsCount) {
    this.history.push({
      matchId,
      win: winStatus,
      winners: winnersCount,
      errors: unforcedErrorsCount,
      date: new Date().toLocaleDateString()
    });
    console.log(`Seguimiento: Registro histórico añadido. Total partidos analizados: ${this.history.length}`);
  }
}

window.PerformanceTracker = PerformanceTracker;

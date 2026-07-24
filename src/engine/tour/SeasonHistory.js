/**
 * SeasonHistory - Historial anual de victorias, ELOs máximos logrados y clasificaciones de fin de año.
 */
class SeasonHistory {
  constructor() {
    this.history = [];
  }

  archiveSeason(seasonIndex, finalPoints, finalPosition) {
    this.history.push({
      season: seasonIndex,
      points: finalPoints,
      rank: finalPosition,
      date: new Date().getFullYear()
    });
    console.log(`Historial: Temporada ${seasonIndex} archivada con éxito.`);
  }
}

window.SeasonHistory = SeasonHistory;

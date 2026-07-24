/**
 * GrandFinalManager - Configura e inicia las finales mundiales de final de temporada (Top 8).
 */
class GrandFinalManager {
  constructor() {
    this.qualifiedPlayers = [];
  }

  checkQualifications(worldRankingsList) {
    // Clasifican únicamente los top 8 jugadores del ranking profesional
    this.qualifiedPlayers = worldRankingsList.slice(0, 8);
    console.log(`Grand Finals: Clasificados para las finales mundiales de fin de temporada:`, this.qualifiedPlayers);
  }
}

window.GrandFinalManager = GrandFinalManager;

/**
 * SeasonManager - Controla el calendario de temporadas clasificatorias competitivas.
 */
class SeasonManager {
  constructor() {
    this.currentSeasonName = "Temporada 1: Creadores AI";
    this.daysRemaining = 18;
  }

  getSeasonDetails() {
    return {
      season: this.currentSeasonName,
      daysLeft: this.daysRemaining,
      rewards: ['Pala Carbono Edición Limitada', 'Dorsal Dorado']
    };
  }
}

window.SeasonManager = SeasonManager;

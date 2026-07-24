/**
 * SeasonLiveManager - Ciclos mensuales y distribución de recompensas de temporadas online.
 */
class SeasonLiveManager {
  constructor() {
    this.currentSeasonIndex = 2;
    this.remainingHours = 430;
  }

  claimSeasonRewards(userElo) {
    if (userElo > 1600) {
      console.log('Season Live: Otorgado "Pala Platino" por clasificación alta.');
      return ['Pala Platino', '1000 Coins'];
    }
    return ['500 Coins'];
  }
}

window.SeasonLiveManager = SeasonLiveManager;

/**
 * GlobalRanking - Clasificación general de ELO para jugadores, clubes y países a nivel mundial.
 */
class GlobalRanking {
  constructor() {
    this.rankings = [
      { name: 'Maya', elo: 2450, country: 'Argentina' },
      { name: 'Ramos', elo: 2310, country: 'España' }
    ];
  }

  getLeaderboard() {
    return this.rankings;
  }
}

window.GlobalRanking = GlobalRanking;

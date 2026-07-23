class RankingManager {
  constructor() {
    this.globalRankings = [];
  }

  updateELO(playerElo, opponentElo, playerWon) {
    const kFactor = 32;
    const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
    const actual = playerWon ? 1 : 0;
    return Math.round(playerElo + kFactor * (actual - expected));
  }
}
if (typeof module !== 'undefined') module.exports = RankingManager;
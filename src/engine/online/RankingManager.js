/**
 * RankingManager - Registra tablas de clasificación a nivel global y de clubes.
 */
class RankingManager {
  constructor() {
    this.leaderboard = [
      { rank: 1, name: 'Maya', elo: 2450, wins: 180, losses: 24, streak: 12 },
      { rank: 2, name: 'Ramos', elo: 2310, wins: 154, losses: 32, streak: 5 },
      { rank: 3, name: 'Chen', elo: 2180, wins: 120, losses: 40, streak: -1 },
      { rank: 4, name: 'Jugador', elo: 1500, wins: 0, losses: 0, streak: 0 }
    ];
  }

  getRankings() {
    return this.leaderboard;
  }

  updateElo(playerElo, won) {
    const kFactor = 32;
    const expected = 0.5; // Probabilidad de ganar media
    const actual = won ? 1 : 0;
    
    const newElo = Math.round(playerElo + kFactor * (actual - expected));
    console.log(`RankingManager: ELO recalculado. Anterior: ${playerElo} -> Nuevo: ${newElo}`);
    return newElo;
  }
}

window.RankingManager = RankingManager;

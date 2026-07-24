/**
 * TournamentSimulator - Simula rondas CPU vs CPU de torneos profesionales rápidamente.
 */
class TournamentSimulator {
  constructor() {
    this.surpriseFactor = 0.2; // Probabilidad de victoria sorpresa de menor clasificado
  }

  simulateMatch(player1Elo, player2Elo) {
    const probability = 1.0 / (1.0 + Math.pow(10, (player2Elo - player1Elo) / 400));
    const roll = Math.random();

    // Determinar ganador
    if (roll < probability) {
      return { winner: 'p1', score: '6-4, 7-5' };
    }
    return { winner: 'p2', score: '3-6, 4-6' };
  }
}

window.TournamentSimulator = TournamentSimulator;

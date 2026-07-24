/**
 * RankingWorld - Escalafón y ranking mundial del circuito profesional de pádel.
 */
class RankingWorld {
  constructor() {
    this.points = 120;
    this.worldPosition = 45; // Rank inicial
  }

  addPoints(roundReached, tournamentType) {
    let earned = 10;
    if (roundReached === 'final') {
      earned = tournamentType === 'Grand Slam' ? 2000 : 1000;
    } else if (roundReached === 'semifinal') {
      earned = tournamentType === 'Grand Slam' ? 1200 : 600;
    }
    this.points += earned;
    
    // Simular escalada de puesto
    if (this.points > 2000) this.worldPosition = 5;
    else if (this.points > 1000) this.worldPosition = 15;

    console.log(`Ranking Mundial: +${earned} Puntos. Posición actual: ${this.worldPosition}º del mundo.`);
  }
}

window.RankingWorld = RankingWorld;

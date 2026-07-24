/**
 * WorldCareerManager - Modela temporadas clasificatorias, ascensos y ligas profesionales del Tour.
 */
class WorldCareerManager {
  constructor() {
    this.currentLeague = 'Segunda División';
    this.wins = 0;
    this.losses = 0;
    this.points = 0;
  }

  processMatchResult(won) {
    if (won) {
      this.wins++;
      this.points += 3;
    } else {
      this.losses++;
    }

    console.log(`Mundo Profesional: Temporada en curso. Puntos: ${this.points}. Historial: ${this.wins}V - ${this.losses}D`);
    this.checkPromotion();
  }

  checkPromotion() {
    if (this.points >= 15 && this.currentLeague === 'Segunda División') {
      this.currentLeague = 'Primera División';
      this.points = 0;
      console.log('Mundo Profesional: ¡ASCENSO CONSEGUIDO! Promocionado a Primera División.');
    }
  }
}

window.WorldCareerManager = WorldCareerManager;

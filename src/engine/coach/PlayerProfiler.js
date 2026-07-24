/**
 * PlayerProfiler - Clasifica el estilo del jugador (ofensivo, defensivo, pasabolas).
 */
class PlayerProfiler {
  constructor() {
    this.strengths = ['Smash Potente', 'Volea precisa'];
    this.weaknesses = ['Revés cortado'];
  }

  determineStyle(winners, unforcedErrors, avgHitSpeed) {
    if (avgHitSpeed > 65 && winners > 4) {
      return 'Rematador Agresivo (Atacante)';
    } else if (unforcedErrors < 2) {
      return 'Especialista en Defensa (Contrarrestador)';
    }
    return 'Jugador Equilibrado';
  }
}

window.PlayerProfiler = PlayerProfiler;

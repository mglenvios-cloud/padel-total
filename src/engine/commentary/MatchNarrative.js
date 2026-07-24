/**
 * MatchNarrative - Hilvana la historia deportiva del partido actual y hitos de carrera.
 */
class MatchNarrative {
  constructor() {
    this.historyEvents = [];
  }

  logChampionship() {
    this.historyEvents.push("¡Primer título profesional ganado!");
    console.log('Narrativa: Historia de carrera actualizada -> Campeón.');
  }
}

window.MatchNarrative = MatchNarrative;

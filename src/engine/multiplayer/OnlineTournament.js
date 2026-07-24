/**
 * OnlineTournament - Organiza las copas semanales en línea y emparejamientos de torneo.
 */
class OnlineTournament {
  constructor() {
    this.cupsList = [
      { name: 'Copa Semanal Oro', entryCost: 200, points: 500 },
      { name: 'Challenger Online', entryCost: 100, points: 250 }
    ];
  }

  getAvailableCups() {
    return this.cupsList;
  }
}

window.OnlineTournament = OnlineTournament;

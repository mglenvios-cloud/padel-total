/**
 * EsportsManager - Orquestador de torneos profesionales reglamentados y clasificaciones.
 */
class EsportsManager {
  constructor() {
    this.activeTournaments = [
      { name: 'Padel Pro Open Master', prizePool: '$10,000', entrants: 64 },
      { name: 'Vercel Challenger', prizePool: '$2,500', entrants: 32 }
    ];
  }

  getTournamentsList() {
    return this.activeTournaments;
  }
}

window.EsportsManager = EsportsManager;

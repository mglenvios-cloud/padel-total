/**
 * TournamentDatabase - Base de datos de torneos oficiales de pádel (Grand Slam, Master, Open).
 */
const TournamentDatabase = {
  events: [
    { id: 'ts_01', name: 'Madrid Master', type: 'Master', entryPoints: 1000, prizePool: 25000 },
    { id: 'ts_02', name: 'Paris Grand Slam', type: 'Grand Slam', entryPoints: 2000, prizePool: 60000 },
    { id: 'ts_03', name: 'Buenos Aires Open', type: 'Open', entryPoints: 500, prizePool: 12000 }
  ],

  getEvent(id) {
    return this.events.find(e => e.id === id) || this.events[0];
  }
};

window.TournamentDatabase = TournamentDatabase;

/**
 * ClubDatabase - Base de datos de clubes de pádel del mundo.
 */
const ClubDatabase = {
  clubs: [
    { id: 'club_01', name: 'Real Club de Tenis Barcelona', country: 'España', reputation: 85 },
    { id: 'club_02', name: 'Padel Club Roma', country: 'Italia', reputation: 70 },
    { id: 'club_03', name: 'Buenos Aires Padel Center', country: 'Argentina', reputation: 80 }
  ],

  getClubPreset(id) {
    return this.clubs.find(c => c.id === id) || this.clubs[0];
  }
};

window.ClubDatabase = ClubDatabase;

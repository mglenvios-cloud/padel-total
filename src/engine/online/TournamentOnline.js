/**
 * TournamentOnline - Gestor de torneos en línea y emparejamientos por eliminación directa.
 */
class TournamentOnline {
  constructor() {
    this.activeBrackets = null;
  }

  generateTournamentBrackets(playersList) {
    console.log('TournamentOnline: Generando brackets para eliminación directa...');
    
    // Generar cuartos de final
    this.activeBrackets = {
      round: 'Cuartos de final',
      matches: [
        { id: 1, p1: playersList[0] || 'Jugador', p2: 'Ramos', score: '' },
        { id: 2, p1: 'Maya', p2: 'Chen', score: '' }
      ]
    };
    return this.activeBrackets;
  }
}

window.TournamentOnline = TournamentOnline;

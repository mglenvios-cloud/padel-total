/**
 * MatchRoom - Administra la lógica de sala 2v2 en línea (Jugadores, puntuación de set/juegos).
 */
class MatchRoom {
  constructor() {
    this.players = {
      teamA: ['P1_Local', 'P2_Partner'],
      teamB: ['P3_Rival1', 'P4_Rival2']
    };
    this.score = { gamesA: 0, gamesB: 0 };
  }

  updateScore(team, gamePoints) {
    if (team === 'A') {
      this.score.gamesA = gamePoints;
    } else {
      this.score.gamesB = gamePoints;
    }
    console.log(`Sala Multijugador: Puntuación de sala actualizada -> A: ${this.score.gamesA} - B: ${this.score.gamesB}`);
  }
}

window.MatchRoom = MatchRoom;

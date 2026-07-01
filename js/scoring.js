// ============================================================
// SCORING.JS — Sistema de puntuación FIP oficial
// 0-15-30-40-Juego, Deuce/Ventaja, Sets, Tiebreak, Mejor de 3
// ============================================================

const POINTS_DISPLAY = ['0', '15', '30', '40', 'A'];

class ScoringSystem {
  constructor() {
    this.reset();
  }

  reset() {
    // Puntos en el juego actual (0=0, 1=15, 2=30, 3=40)
    this.gamePoints = [0, 0]; // [team0, team1]
    // Juegos en el set actual
    this.setGames = [0, 0];
    // Sets ganados
    this.sets = [0, 0];
    // Historial de sets
    this.setHistory = [];
    // ¿Estamos en tiebreak?
    this.isTiebreak = false;
    // Puntos en tiebreak
    this.tiebreakPoints = [0, 0];
    // Deuce/Ventaja
    this.isDeuce = false;
    this.advantage = -1; // -1=ninguno, 0=equipo0, 1=equipo1
    // Set actual (1-based)
    this.currentSet = 1;
    // Saque: quién saca (0 o 1)
    this.servingTeam = 0;
    this.serveAttempt = 1; // 1 o 2
    // Ganador del partido
    this.matchWinner = -1;
    // Stats
    this.stats = {
      winners: [0, 0],
      errors: [0, 0],
      aces: [0, 0],
      totalPoints: [0, 0]
    };
  }

  /** Devuelve string del punto actual (ej: "30-15") */
  getScoreString() {
    if (this.isTiebreak) {
      return `${this.tiebreakPoints[0]} - ${this.tiebreakPoints[1]}`;
    }
    if (this.isDeuce) {
      if (this.advantage === -1) return 'DEUCE';
      return this.advantage === 0 ? 'VENTAJA TU' : 'VENTAJA RIVAL';
    }
    return `${POINTS_DISPLAY[this.gamePoints[0]]} - ${POINTS_DISPLAY[this.gamePoints[1]]}`;
  }

  /** Suma un punto al equipo (0 o 1) */
  addPoint(team, type = 'winner') {
    if (this.matchWinner !== -1) return null;

    this.stats.totalPoints[team]++;
    if (type === 'winner') this.stats.winners[team]++;
    if (type === 'error') this.stats.errors[1 - team]++;
    if (type === 'ace') this.stats.aces[team]++;

    if (this.isTiebreak) {
      return this._addTiebreakPoint(team);
    }
    return this._addGamePoint(team);
  }

  _addGamePoint(team) {
    const opp = 1 - team;

    if (this.isDeuce) {
      if (this.advantage === -1) {
        this.advantage = team;
        return { type: 'advantage', team, score: this.getScoreString() };
      } else if (this.advantage === team) {
        return this._winGame(team);
      } else {
        this.advantage = -1;
        return { type: 'deuce', score: 'DEUCE' };
      }
    }

    this.gamePoints[team]++;

    // Gana juego con 4+ puntos (40 = índice 3) y diferencia
    if (this.gamePoints[team] >= 4) {
      if (this.gamePoints[opp] < 3) {
        return this._winGame(team);
      } else {
        // Deuce
        this.isDeuce = true;
        this.advantage = -1;
        this.gamePoints = [3, 3];
        return { type: 'deuce', score: 'DEUCE' };
      }
    }

    return { type: 'point', team, score: this.getScoreString() };
  }

  _addTiebreakPoint(team) {
    this.tiebreakPoints[team]++;
    const [a, b] = this.tiebreakPoints;
    const maxPts = Math.max(a, b);
    const diff = Math.abs(a - b);

    if (maxPts >= 7 && diff >= 2) {
      return this._winSet(team, true);
    }
    return { type: 'tiebreak', team, score: this.getScoreString() };
  }

  _winGame(team) {
    this.gamePoints = [0, 0];
    this.isDeuce = false;
    this.advantage = -1;
    this.setGames[team]++;

    // Cambiar saque
    this.servingTeam = 1 - this.servingTeam;
    this.serveAttempt = 1;

    const [g0, g1] = this.setGames;
    const opp = 1 - team;

    // Verificar si ganó el set
    if (g0 >= 6 || g1 >= 6) {
      const maxG = Math.max(g0, g1);
      const minG = Math.min(g0, g1);

      // Gana set con 6 y diferencia de 2, o con 7-5
      if (maxG >= 6 && maxG - minG >= 2) {
        return this._winSet(team);
      }
      // Tiebreak en 6-6
      if (g0 === 6 && g1 === 6) {
        this.isTiebreak = true;
        this.tiebreakPoints = [0, 0];
        return { type: 'tiebreak_start', games: [g0, g1] };
      }
    }

    return { type: 'game', team, games: [...this.setGames] };
  }

  _winSet(team, fromTiebreak = false) {
    const setScore = fromTiebreak
      ? { scores: [...this.tiebreakPoints], isTiebreak: true }
      : { scores: [...this.setGames] };

    this.setHistory.push({ winner: team, games: [...this.setGames], tiebreak: fromTiebreak });
    this.sets[team]++;
    this.setGames = [0, 0];
    this.isTiebreak = false;
    this.tiebreakPoints = [0, 0];
    this.currentSet++;
    this.serveAttempt = 1;

    // Gana el partido con 2 sets (mejor de 3)
    if (this.sets[team] >= 2) {
      this.matchWinner = team;
      return { type: 'match_won', winner: team, sets: [...this.sets], setHistory: this.setHistory };
    }

    return { type: 'set_won', winner: team, sets: [...this.sets], setHistory: this.setHistory };
  }

  getSetScoreString(teamIdx) {
    return this.setHistory.map(s => s.games[teamIdx]).join(' ');
  }

  isMatchOver() { return this.matchWinner !== -1; }

  // Intentos de saque
  failServe() {
    if (this.serveAttempt === 1) {
      this.serveAttempt = 2;
      return { type: 'second_serve' };
    }
    // Doble falta
    this.serveAttempt = 1;
    return this.addPoint(1 - this.servingTeam, 'error');
  }

  nextServe() { this.serveAttempt = 1; }
}

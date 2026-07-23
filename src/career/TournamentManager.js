class TournamentManager {
  constructor() {
    this.tournaments = [];
  }

  generateBracket(type = 'Cup', playersList = []) {
    const list = playersList.length > 0 ? playersList : ["Tú", "Chen", "Ramos", "Maya", "Coello", "Galan", "Lebron", "Tapia"];
    const bracket = [];
    for (let i = 0; i < list.length; i += 2) {
      bracket.push({
        round: 1,
        matchId: i / 2,
        teamA: list[i],
        teamB: list[i+1],
        score: null,
        winner: null
      });
    }
    return {
      name: `Copa de Oro - ${type}`,
      type: type,
      round: 1,
      bracket: bracket
    };
  }
}
if (typeof module !== 'undefined') module.exports = TournamentManager;
/**
 * LeagueManager (Universe) - Permite la creación y gestión de ligas online (públicas y privadas).
 */
class LeagueManager {
  constructor() {
    this.activeLeagues = [
      { id: 'lg_public_01', name: 'Liga Global Amateur', participants: 120 }
    ];
  }

  createPrivateLeague(creatorId, leagueName) {
    const league = {
      id: `lg_pr_${Date.now()}`,
      creator: creatorId,
      name: leagueName,
      participants: [creatorId]
    };
    this.activeLeagues.push(league);
    console.log(`Ligas Universo: Liga privada '${leagueName}' creada por el usuario.`);
    return league;
  }
}

window.LeagueManager = LeagueManager;

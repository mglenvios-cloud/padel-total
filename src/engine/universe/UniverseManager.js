/**
 * UniverseManager - Orquestador y fachada de entrada para la plataforma Padel Universe.
 * Instancia defensivamente cada subsistema para evitar fallos en cascada.
 */
class UniverseManager {
  constructor() {
    const safe = (Cls) => { try { return new Cls(); } catch(e) { console.warn(`UniverseManager: ${Cls.name || 'módulo'} no disponible`, e.message); return null; } };
    this.profile = safe(UserProfile);
    this.community = safe(CommunityManager);
    this.clubCreator = safe(ClubCreator);
    this.league = safe(LeagueManager);
    this.seasons = safe(SeasonLiveManager);
    this.events = safe(EventManager);
    this.marketplace = safe(MarketplaceOnline);
    this.social = safe(SocialHub);
    this.friends = safe(FriendManager);
    this.ranking = safe(GlobalRanking);
    this.achievements = safe(AchievementWorld);
    this.creator = safe(CreatorTools);
  }
}

window.UniverseManager = UniverseManager;
try {
  window.universeManager = new UniverseManager();
} catch(e) {
  console.warn('UniverseManager: Fallo al inicializar el universo online.', e.message);
}

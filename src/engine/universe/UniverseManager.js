/**
 * UniverseManager - Orquestador y fachada de entrada para la plataforma Padel Universe.
 */
class UniverseManager {
  constructor() {
    this.profile = new UserProfile();
    this.community = new CommunityManager();
    this.clubCreator = new ClubCreator();
    this.league = new LeagueManager();
    this.seasons = new SeasonLiveManager();
    this.events = new EventManager();
    this.marketplace = new MarketplaceOnline();
    this.social = new SocialHub();
    this.friends = new FriendManager();
    this.ranking = new GlobalRanking();
    this.achievements = new AchievementWorld();
    this.creator = new CreatorTools();
  }
}

window.UniverseManager = UniverseManager;
// Autodetectar e instanciar en el namespace
window.universeManager = new UniverseManager();

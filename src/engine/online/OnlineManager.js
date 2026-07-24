/**
 * OnlineManager - Fachada principal de la plataforma de eSports y juego online.
 */
class OnlineManager {
  constructor() {
    this.network = new NetworkManager();
    this.matchmaking = new MatchmakingManager();
    this.ranking = new RankingManager();
    this.tournaments = new TournamentOnline();
    this.clubs = new ClubOnlineManager();
    this.profile = new PlayerProfile();
    this.seasons = new SeasonManager();
    this.esports = new EsportsManager();
    this.replaySync = new ReplaySync(this.network);
  }

  connectToServer(roomToken) {
    this.network.connect('wss://server.padelpro.com/game', roomToken);
  }

  searchMatch() {
    this.matchmaking.startQueue(this.profile.elo);
  }

  syncMatchFrame(ballPos, playerPos, rotation) {
    this.replaySync.syncFrame(ballPos, playerPos, rotation);
  }
}

window.OnlineManager = OnlineManager;

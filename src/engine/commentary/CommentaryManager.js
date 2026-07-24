/**
 * CommentaryManager - Administrador central de la narrativa deportiva y locuciones IA.
 */
class CommentaryManager {
  constructor() {
    this.voice = new VoiceEngine();
    this.detector = new EventDetector();
    this.narrative = new MatchNarrative();
    this.story = new PlayerStory();
    this.rivalry = new RivalryManager();
    this.interview = new InterviewSystem();
    this.news = new NewsGenerator();
    this.crowdAI = new CrowdReactionAI();
    this.highlightNarrator = new HighlightNarrator();
  }

  processTick(ballSpeedKmh, rallyLength, playState) {
    const event = this.detector.detectEvent(ballSpeedKmh, rallyLength, playState);
    if (event) {
      this.voice.speak(event.text, event.emotion);
      this.crowdAI.evaluateSetState(event.type, true);
    }
  }

  announceWinner(playerName, tournamentName) {
    this.news.writeReport(playerName, tournamentName, true);
    this.voice.speak(`¡Final del partido! Victoria consagrada para ${playerName} en el torneo.`, 'excited');
  }
}

window.CommentaryManager = CommentaryManager;

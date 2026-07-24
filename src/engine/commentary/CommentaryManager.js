/**
 * LiveCommentaryManager - Administrador central de la narrativa deportiva y locuciones IA.
 * (Renombrado de CommentaryManager para evitar conflicto con broadcast/CommentaryManager)
 */
class LiveCommentaryManager {
  constructor() {
    try { this.voice = new VoiceEngine(); } catch(e) { this.voice = null; }
    try { this.detector = new EventDetector(); } catch(e) { this.detector = null; }
    try { this.narrative = new MatchNarrative(); } catch(e) { this.narrative = null; }
    try { this.story = new PlayerStory(); } catch(e) { this.story = null; }
    try { this.rivalry = new RivalryManager(); } catch(e) { this.rivalry = null; }
    try { this.interview = new InterviewSystem(); } catch(e) { this.interview = null; }
    try { this.news = new NewsGenerator(); } catch(e) { this.news = null; }
    try { this.crowdAI = new CrowdReactionAI(); } catch(e) { this.crowdAI = null; }
    try { this.highlightNarrator = new HighlightNarrator(); } catch(e) { this.highlightNarrator = null; }
  }

  processTick(ballSpeedKmh, rallyLength, playState) {
    if (!this.detector || !this.voice) return;
    const event = this.detector.detectEvent(ballSpeedKmh, rallyLength, playState);
    if (event) {
      this.voice.speak(event.text, event.emotion);
      if (this.crowdAI) this.crowdAI.evaluateSetState(event.type, true);
    }
  }

  announceWinner(playerName, tournamentName) {
    if (this.news) this.news.writeReport(playerName, tournamentName, true);
    if (this.voice) this.voice.speak(`¡Final del partido! Victoria consagrada para ${playerName} en el torneo.`, 'excited');
  }
}

window.LiveCommentaryManager = LiveCommentaryManager;

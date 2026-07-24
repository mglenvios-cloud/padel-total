/**
 * CoachManager - Administrador central del Coach IA y del Análisis Táctico.
 */
class CoachManager {
  constructor() {
    this.analyzer = new MatchAnalyzer();
    this.tactics = new TacticalAnalyzer();
    this.heatmap = new HeatmapEngine();
    this.profiler = new PlayerProfiler();
    this.scout = new OpponentScout();
    this.advisor = new TrainingAdvisor();
    this.recommendation = new AIRecommendation();
    this.tracker = new PerformanceTracker();
  }

  processPositionTick(x, z) {
    this.heatmap.registerPosition(x, z);
    this.tactics.analyzePosition({ x, z });
  }

  logShot(playerName, shotType, velocity) {
    this.analyzer.logHit(playerName, shotType, velocity);
  }

  getAdvice() {
    const errorCount = this.analyzer.unforcedErrors;
    const hotZone = this.heatmap.getHotspot();
    console.log(`Coach IA: Analizando zona dominante -> ${hotZone}`);
    return this.recommendation.getLiveRecommendation(errorCount, 50);
  }
}

window.CoachManager = CoachManager;

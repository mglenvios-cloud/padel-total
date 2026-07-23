class CoachManager {
  static analyzeHeatmap(ballPositions = []) {
    return ballPositions.map(pos => ({
      x: pos.x,
      z: pos.z,
      intensity: 0.8
    }));
  }
}
if (typeof module !== 'undefined') module.exports = CoachManager;
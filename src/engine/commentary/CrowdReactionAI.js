/**
 * CrowdReactionAI - Modifica el volumen y respuesta de la afición según el pulso del set.
 */
class CrowdReactionAI {
  constructor() {
    this.noiseCoefficient = 1.0;
  }

  evaluateSetState(pointImportance, won) {
    if (pointImportance === 'match_point') {
      this.noiseCoefficient = 2.0; // Clímax absoluto
      console.log('Crowd AI: Tensión máxima. Público expectante en silencio...');
    } else {
      this.noiseCoefficient = 1.2;
    }
  }
}

window.CrowdReactionAI = CrowdReactionAI;

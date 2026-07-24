/**
 * AIRecommendation - Genera recomendaciones verbales en tiempo real del entrenador de IA.
 */
class AIRecommendation {
  constructor() {
    this.advices = [
      "¡Sube más a la red tras el saque para recortar espacio!",
      "El rival comete más fallos en su revés, ataca ese sector.",
      "Reduce golpes arriesgados desde el fondo de la pista."
    ];
  }

  getLiveRecommendation(unforcedErrors, ballSpeedKmh) {
    if (unforcedErrors > 3) {
      return this.advices[2]; // Jugar seguro
    }
    if (ballSpeedKmh > 75) {
      return this.advices[0]; // Subir a presionar
    }
    return this.advices[1]; // Atacar revés
  }
}

window.AIRecommendation = AIRecommendation;

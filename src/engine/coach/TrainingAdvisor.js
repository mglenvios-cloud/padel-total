/**
 * TrainingAdvisor - Sugiere ejercicios físicos y técnicos en base al desempeño.
 */
class TrainingAdvisor {
  constructor() {
    this.drills = [
      { name: 'Práctica de Volea', target: 'control', xpReward: 150 },
      { name: 'Drill de Smashes', target: 'potencia', xpReward: 200 }
    ];
  }

  recommendDrill(unforcedErrorsCount) {
    if (unforcedErrorsCount > 4) {
      return this.drills.find(d => d.target === 'control');
    }
    return this.drills[1];
  }
}

window.TrainingAdvisor = TrainingAdvisor;

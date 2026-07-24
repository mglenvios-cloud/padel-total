/**
 * InterviewSystem - Sistema de conferencias de prensa post-partido con opciones de diálogo.
 */
class InterviewSystem {
  constructor() {
    this.reputationEffect = 0;
  }

  triggerInterview() {
    const question = "¿Cómo evalúas el desempeño táctico en este set?";
    const answers = [
      { text: "Estuvimos muy firmes en la red.", reputationChange: 5 },
      { text: "Faltó control en los remates.", reputationChange: -2 }
    ];
    return { question, answers };
  }
}

window.InterviewSystem = InterviewSystem;

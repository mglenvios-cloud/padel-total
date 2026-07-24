/**
 * OpponentScout - Analiza debilidades del oponente y patrones repetidos de golpes.
 */
class OpponentScout {
  constructor() {
    this.rivalWeaknesses = ['Juego de red lento', 'Bandeja errática'];
  }

  getAdviceForRival(rivalName) {
    console.log(`Scouting: Generando informe táctico contra ${rivalName}...`);
    return `El rival ${rivalName} suele perder el control al recibir globos profundos sobre su lado de revés.`;
  }
}

window.OpponentScout = OpponentScout;

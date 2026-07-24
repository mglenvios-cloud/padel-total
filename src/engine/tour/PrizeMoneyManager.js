/**
 * PrizeMoneyManager - Gestión de bolsas de premios financieros y ganancias acumuladas.
 */
class PrizeMoneyManager {
  constructor() {
    this.totalCareerEarnings = 0;
  }

  processTournamentPayout(roundReached, eventData) {
    let multiplier = 0.05; // 5% de la bolsa por clasificar/octavos
    if (roundReached === 'final') {
      multiplier = 0.45; // 45% del pozo al campeón
    } else if (roundReached === 'semifinal') {
      multiplier = 0.20;
    }
    const payout = Math.round(eventData.prizePool * multiplier);
    this.totalEarnings += payout;
    console.log(`Premios Financieros: Ganancia por ronda '${roundReached}' -> +${payout} Monedas`);
    return payout;
  }
}

window.PrizeMoneyManager = PrizeMoneyManager;

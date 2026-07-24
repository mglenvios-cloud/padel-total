/**
 * CurrencyManager - Gestiona las monedas del juego (Monedas, Créditos, Puntos de Torneo).
 */
class CurrencyManager {
  constructor() {
    this.coins = 1000;
    this.credits = 150;
    this.tournamentPoints = 0;
  }

  addCoins(amount) {
    this.coins += amount;
    console.log(`Economy: +${amount} Monedas. Total: ${this.coins}`);
  }

  spendCoins(amount) {
    if (this.coins >= amount) {
      this.coins -= amount;
      return true;
    }
    return false;
  }
}

window.CurrencyManager = CurrencyManager;

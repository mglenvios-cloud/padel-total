/**
 * RewardManager - Otorga monedas y trofeos en base a logros y rachas de victorias.
 */
class RewardManager {
  constructor(currencyManager) {
    this.currency = currencyManager;
  }

  claimMatchReward(won, pointsCount) {
    let coinsEarned = 50; // Recompensa base por participar
    if (won) {
      coinsEarned += 100;
    }
    this.currency.addCoins(coinsEarned);
    console.log(`Rewards: Reclamada recompensa de fin de partido (+${coinsEarned} Monedas)`);
  }
}

window.RewardManager = RewardManager;

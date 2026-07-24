/**
 * SeasonPassManager - Controla la progresión de niveles y recompensas del pase de temporada.
 */
class SeasonPassManager {
  constructor() {
    this.xp = 0;
    this.tier = 1;
    this.maxTiers = 50;
  }

  addXP(amount) {
    this.xp += amount;
    const xpRequired = this.tier * 250;
    if (this.xp >= xpRequired) {
      this.tier = Math.min(this.maxTiers, this.tier + 1);
      this.xp = 0;
      console.log(`SeasonPass: ¡Subida de nivel del pase de temporada! Nivel actual: ${this.tier}`);
    }
  }
}

window.SeasonPassManager = SeasonPassManager;

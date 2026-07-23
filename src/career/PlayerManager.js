class PlayerManager {
  constructor(data) {
    this.name = data.name || "Invitado";
    this.nationality = data.nationality || "ES";
    this.age = data.age || 22;
    this.hand = data.hand || "right";
    this.style = data.style || "drive";
    this.avatar = data.avatar || "avatar_1.png";
    this.level = data.level || 1;
    this.xp = data.xp || 0;
    this.energy = data.energy || 100;
    this.morale = data.morale || 85;
    this.confidence = data.confidence || 75;
    this.fatigue = data.fatigue || 0;
    this.injuries = data.injuries || [];
    this.stats = data.stats || { matchesPlayed: 0, wins: 0, losses: 0 };
    this.history = data.history || [];
  }

  gainXP(amount) {
    this.xp += amount;
    const nextLevelXP = this.level * 1000;
    if (this.xp >= nextLevelXP) {
      this.xp -= nextLevelXP;
      this.level++;
      this.morale = Math.min(100, this.morale + 10);
      this.confidence = Math.min(100, this.confidence + 5);
      return true; // Level Up
    }
    return false;
  }

  rest(hours) {
    this.fatigue = Math.max(0, this.fatigue - hours * 4);
    this.energy = Math.min(100, this.energy + hours * 6);
  }

  train(intensity) {
    this.fatigue = Math.min(100, this.fatigue + intensity * 15);
    this.energy = Math.max(0, this.energy - intensity * 12);
  }
}
if (typeof module !== 'undefined') module.exports = PlayerManager;
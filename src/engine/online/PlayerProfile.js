/**
 * PlayerProfile - Perfil de cuenta persistente de red y personalización desbloqueada.
 */
class PlayerProfile {
  constructor() {
    this.username = "Jugador";
    this.level = 5;
    this.xp = 1200;
    this.elo = 1500;
    this.wins = 24;
    this.losses = 8;
    this.trophyCabinet = ['Copa Nacional 2026'];
  }

  addXP(amount) {
    this.xp += amount;
    if (this.xp >= this.level * 500) {
      this.level++;
      this.xp = 0;
      console.log(`PlayerProfile: ¡SUBIDA DE NIVEL! Nuevo nivel: ${this.level}`);
    }
  }
}

window.PlayerProfile = PlayerProfile;

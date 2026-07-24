/**
 * ClubManager - Gestiona la reputación, trofeos e historial general del club.
 */
class ClubManager {
  constructor() {
    this.name = "Mi Club de Pádel";
    this.reputation = 50; // Nivel de prestigio base 1-100
    this.trophies = [];
    this.history = ["Club fundado en el año 2027."];
  }

  addTrophy(trophyName) {
    this.trophies.push(trophyName);
    this.reputation = Math.min(100, this.reputation + 8);
    console.log(`ClubManager: ¡Trofeo añadido a las vitrinas! Reputación actual: ${this.reputation}`);
  }
}

window.ClubManager = ClubManager;

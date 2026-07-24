/**
 * PlayerIdentity - Estructura de identidad del jugador (Dorsal, mano dominante, estilo).
 */
class PlayerIdentity {
  constructor() {
    this.name = "Mi Jugador";
    this.nationality = "Argentina";
    this.age = 22;
    this.jerseyNumber = 10;
    this.dominantHand = 'right'; // 'right' o 'left'
    this.playStyle = 'balanced';
  }

  setIdentity(name, nation, hand) {
    this.name = name;
    this.nationality = nation;
    this.dominantHand = hand;
    console.log(`Identidad: Perfil actualizado -> ${name} (${nation}), Mano: ${hand}`);
  }
}

window.PlayerIdentity = PlayerIdentity;

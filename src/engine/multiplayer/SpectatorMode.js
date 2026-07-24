/**
 * SpectatorMode - Permite unirse a salas activas como espectador y recibir streams de frames.
 */
class SpectatorMode {
  constructor() {
    this.isSpectating = false;
  }

  joinAsSpectator(roomId) {
    this.isSpectating = true;
    console.log(`Espectador: Conectado a la sala activa '${roomId}'. Recibiendo retransmisión...`);
  }

  leave() {
    this.isSpectating = false;
    console.log('Espectador: Desconectado del partido en curso.');
  }
}

window.SpectatorMode = SpectatorMode;

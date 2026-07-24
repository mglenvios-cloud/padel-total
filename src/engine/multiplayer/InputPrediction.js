/**
 * InputPrediction - Predice los movimientos locales antes de recibir la confirmación del servidor.
 */
class InputPrediction {
  constructor() {
    this.pendingInputs = [];
  }

  predictMovement(playerPos, inputVector, dt) {
    // Aplicar input instantáneamente de forma local
    playerPos.x += inputVector.x * dt * 5.0; // Velocidad de movimiento base
    playerPos.z += inputVector.z * dt * 5.0;
  }
}

window.InputPrediction = InputPrediction;

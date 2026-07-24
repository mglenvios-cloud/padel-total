/**
 * AntiCheat - Intercepta teletransportaciones ilícitas y velocidades de movimiento imposibles.
 */
class AntiCheat {
  constructor() {
    this.maxAllowedVelocity = 18.0; // En metros/segundo
  }

  validateFrame(currentPos, prevPos, dt) {
    if (!prevPos) return true;

    const distance = currentPos.distanceTo(prevPos);
    const speed = distance / dt;

    if (speed > this.maxAllowedVelocity) {
      console.warn(`Anti-Cheat: Anomalía detectada. Velocidad calculada: ${speed} m/s. Interceptando...`);
      return false; // Bloquear frame
    }
    return true; // Frame válido
  }
}

window.AntiCheat = AntiCheat;

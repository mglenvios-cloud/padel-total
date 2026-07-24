/**
 * MotionDatabase - Base de datos de emparejamiento de movimiento (Motion Matching).
 * Contiene metadatos de poses, velocidades y trayectorias de las animaciones.
 */
class MotionDatabase {
  constructor() {
    this.frames = []; // Base de datos de poses registradas
  }

  /**
   * Registra una pose en la base de datos para búsqueda en tiempo real.
   */
  registerFrame(animationName, time, jointPositions, velocity, direction) {
    this.frames.push({
      animationName,
      time,
      jointPositions, // Mapa de posiciones locales de articulaciones clave
      velocity: velocity.clone(),
      direction: direction.clone()
    });
  }

  /**
   * Busca la pose más cercana que coincida con las condiciones de velocidad y dirección objetivo.
   */
  findBestMatch(targetVelocity, targetDirection, currentPoseWeights) {
    let bestFrame = null;
    let minCost = Infinity;

    // Lógica simplificada de distancia de características (Feature Distance Cost)
    for (let i = 0; i < this.frames.length; i++) {
      const frame = this.frames[i];
      
      const velCost = frame.velocity.distanceTo(targetVelocity);
      const dirCost = frame.direction.distanceTo(targetDirection);
      const cost = velCost * 0.7 + dirCost * 0.3;

      if (cost < minCost) {
        minCost = cost;
        bestFrame = frame;
      }
    }

    return bestFrame;
  }
}

window.MotionDatabase = MotionDatabase;

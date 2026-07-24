/**
 * RollbackSystem - Sistema de Rollback netcode para corregir posiciones ante desajustes.
 */
class RollbackSystem {
  constructor() {
    this.frameBuffer = [];
  }

  saveFrameState(frameId, playerState) {
    this.frameBuffer.push({ frameId, state: playerState });
    if (this.frameBuffer.length > 60) this.frameBuffer.shift();
  }

  rollbackToFrame(frameId, authoritativeState) {
    const historical = this.frameBuffer.find(f => f.frameId === frameId);
    if (historical) {
      // Si la predicción difiere de la realidad, reescribir e inyectar el estado del servidor
      const deltaX = Math.abs(historical.state.x - authoritativeState.x);
      const deltaZ = Math.abs(historical.state.z - authoritativeState.z);

      if (deltaX > 0.05 || deltaZ > 0.05) {
        console.warn(`Rollback: Predicción errónea en frame ${frameId}. Corrigiendo...`);
        return authoritativeState;
      }
    }
    return null;
  }
}

window.RollbackSystem = RollbackSystem;

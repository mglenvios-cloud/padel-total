/**
 * ReplaySync - Transmite y sincroniza de forma remota las posiciones y repeticiones.
 */
class ReplaySync {
  constructor(networkManager) {
    this.network = networkManager;
  }

  syncFrame(ballPos, playerPos, rotation) {
    if (this.network) {
      this.network.sendState({
        x: ballPos.x,
        y: ballPos.y,
        z: ballPos.z,
        px: playerPos.x,
        pz: playerPos.z,
        rot: rotation
      });
    }
  }
}

window.ReplaySync = ReplaySync;

/**
 * PlayerSync - Sincronizador de coordenadas, orientación y animaciones del rig a 60 FPS.
 */
class PlayerSync {
  constructor() {
    this.lastPacketTime = 0;
  }

  serializePlayer(playerMesh) {
    if (!playerMesh) return null;
    return {
      x: playerMesh.position.x,
      z: playerMesh.position.z,
      rotY: playerMesh.rotation.y,
      animState: playerMesh.userData.animState || 'idle',
      timestamp: Date.now()
    };
  }

  deserializePlayer(playerMesh, packet) {
    if (!playerMesh || !packet) return;

    // Interpolación lineal rápida (lerp)
    playerMesh.position.x = THREE.MathUtils.lerp(playerMesh.position.x, packet.x, 0.35);
    playerMesh.position.z = THREE.MathUtils.lerp(playerMesh.position.z, packet.z, 0.35);
    playerMesh.rotation.y = THREE.MathUtils.lerp(playerMesh.rotation.y, packet.rotY, 0.35);
    playerMesh.userData.animState = packet.animState;
  }
}

window.PlayerSync = PlayerSync;

/**
 * BallSync - Sincroniza la trayectoria, botes y colisiones de la pelota online.
 */
class BallSync {
  constructor() {
    this.predictedPos = new THREE.Vector3();
  }

  syncBall(ballMesh, packet) {
    if (!ballMesh || !packet) return;

    // Interpolación de pelota para evitar parpadeos
    ballMesh.position.x = THREE.MathUtils.lerp(ballMesh.position.x, packet.x, 0.4);
    ballMesh.position.y = THREE.MathUtils.lerp(ballMesh.position.y, packet.y, 0.4);
    ballMesh.position.z = THREE.MathUtils.lerp(ballMesh.position.z, packet.z, 0.4);
  }
}

window.BallSync = BallSync;

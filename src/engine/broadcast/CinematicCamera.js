/**
 * CinematicCamera - Define los presets de cámaras de retransmisión deportiva.
 */
class CinematicCamera {
  constructor() {
    this.targetPos = new THREE.Vector3();
    this.lookPos = new THREE.Vector3();
  }

  getPreset(mode, ballPos, playerPos, timer, frame) {
    const ball = ballPos || new THREE.Vector3(0, 0.5, 0);
    const player = playerPos || new THREE.Vector3(0, 0, 7);

    switch (mode) {
      case 'broadcast':
        // Cámara de televisión tradicional fija elevada
        this.targetPos.set(0, 9.8, 19.5);
        this.lookPos.set(ball.x * 0.45, ball.y * 0.35, ball.z * 0.45);
        break;

      case 'follow':
        // Seguir al jugador en primer plano
        this.targetPos.set(player.x - 2, 2.5, player.z + 4.5);
        this.lookPos.copy(player).y += 1.2;
        break;

      case 'spider':
        // Cámara Spidercam cenital sobre cables móvil
        this.targetPos.set(Math.sin(timer * 0.2) * 5, 21.0, ball.z * 0.1);
        this.lookPos.set(ball.x, 0, ball.z);
        break;

      case 'net':
        // Cámara de red baja fija lateral
        this.targetPos.set(13.8, 2.8, ball.z * 0.25);
        this.lookPos.set(ball.x * 0.5, ball.y * 0.6, ball.z * 0.6);
        break;

      case 'chase':
        // Cámara trasera dinámica
        this.targetPos.set(player.x, 3.2, player.z + 5.0);
        this.lookPos.copy(ball);
        break;

      default:
        this.targetPos.set(0, 9.8, 19.5);
        this.lookPos.set(0, 0, 0);
    }

    return { targetPos: this.targetPos, lookPos: this.lookPos };
  }
}

window.CinematicCamera = CinematicCamera;

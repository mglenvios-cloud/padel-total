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
      case 'high':
      case 'alta':
        // Cámara Alta Gran Angular (Visión táctica del estadio)
        this.targetPos.set(0, 14.5, 22.0);
        this.lookPos.set(ball.x * 0.25, 0.2, ball.z * 0.25);
        break;

      case 'medium':
      case 'media':
      case 'broadcast':
        // Cámara Media WPT (Televisiva con paneo suave)
        this.targetPos.set(ball.x * 0.15, 8.4, 16.8);
        this.lookPos.set(ball.x * 0.45, 0.4, ball.z * 0.45);
        break;

      case 'low':
      case 'baja':
      case 'courtside':
        // Cámara Baja a pie de pista (Máxima sensación de velocidad e inmersión)
        const sideOffset = Math.sign(player.x || 1) * 1.5;
        this.targetPos.set(player.x * 0.5 + sideOffset, 2.1, 12.2);
        this.lookPos.set(ball.x * 0.65, Math.max(0.6, ball.y * 0.6 + 0.4), ball.z * 0.65);
        break;

      case 'spider':
      case 'spidercam':
        // Cámara SpiderCam aérea cenital sobre cables
        this.targetPos.set(Math.sin(timer * 0.3) * 6, 18.5, ball.z * 0.12);
        this.lookPos.set(ball.x * 0.8, 0, ball.z * 0.8);
        break;

      case 'dynamic':
      case 'tv':
      default:
        // Cámara Dinámica TV Pro (Cambia según velocidad y altura de bola)
        if (ball.y > 2.8) {
          // Remate / Smash: Toma baja contra picada
          this.targetPos.set(ball.x * 0.4, 3.2, 14.5);
          this.lookPos.set(ball.x, ball.y, ball.z);
        } else if (Math.abs(ball.z) < 2) {
          // Zona de Red: Cámara media veloz
          this.targetPos.set(ball.x * 0.2, 6.8, 15.0);
          this.lookPos.set(ball.x * 0.5, 0.5, ball.z * 0.5);
        } else {
          // Rally de fondo: Cámara televisiva fluida
          this.targetPos.set(ball.x * 0.18, 8.8, 17.5);
          this.lookPos.set(ball.x * 0.4, 0.3, ball.z * 0.4);
        }
        break;
    }

    return { targetPos: this.targetPos, lookPos: this.lookPos };
  }
}

window.CinematicCamera = CinematicCamera;

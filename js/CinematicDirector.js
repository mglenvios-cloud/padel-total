/**
 * CinematicDirector - Director de cámaras y repeticiones deportivas de estilo televisión.
 */
class CinematicDirector {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.modes = ['broadcast', 'closeUp', 'aerial', 'sideLine', 'chase'];
    this.activeMode = 'broadcast';
    
    this.timer = 0;
    this.transitionSpeed = 2.0;

    this.targetPos = new THREE.Vector3();
    this.lookPos = new THREE.Vector3();
  }

  /**
   * Cambia el modo de cámara cinematográfica.
   */
  setMode(mode) {
    if (this.modes.includes(mode)) {
      this.activeMode = mode;
      console.log(`CinematicDirector: Cambiando modo a '${mode}'`);
    }
  }

  /**
   * Calcula y actualiza la posición y orientación de la cámara para la escena en base al estado de juego.
   */
  update(dt, ballPos, players, playState, frame) {
    this.timer += dt;

    const ball = ballPos || new THREE.Vector3(0, 0.5, 0);
    const human = players ? players.find(p => p.isHuman) : null;
    const humanPos = human && human.mesh ? human.mesh.position : new THREE.Vector3(0, 0, 7);

    // Definición de presets de cámaras deportivas
    switch (this.activeMode) {
      case 'broadcast':
        // Cámara clásica de TV de pádel detrás de la red
        this.targetPos.set(0, 9.8, 19.5);
        this.lookPos.set(ball.x * 0.45, ball.y * 0.35, ball.z * 0.45);
        break;

      case 'closeUp':
        // Primer plano del jugador humano siguiendo su acción
        this.targetPos.set(humanPos.x - 2, 2.5, humanPos.z + 4.5);
        this.lookPos.copy(humanPos).y += 1.2;
        break;

      case 'aerial':
        // Cámara aérea móvil tipo Spidercam
        this.targetPos.set(Math.sin(this.timer * 0.2) * 5, 21.0, ball.z * 0.1);
        this.lookPos.set(ball.x, 0, ball.z);
        break;

      case 'sideLine':
        // Cámara lateral baja a nivel de suelo para planos dinámicos
        this.targetPos.set(13.8, 2.8, ball.z * 0.25);
        this.lookPos.set(ball.x * 0.5, ball.y * 0.6, ball.z * 0.6);
        break;

      case 'chase':
        // Cámara trasera que persigue al jugador
        this.targetPos.set(humanPos.x, 3.2, humanPos.z + 5.0);
        this.lookPos.copy(ball);
        break;
    }

    // Comportamiento del Director IA: Cambios de cámara según situación
    if (playState === 'serve' && this.activeMode !== 'closeUp' && Math.random() < 0.005) {
      this.setMode('closeUp');
    } else if (playState === 'rally' && this.activeMode === 'closeUp') {
      this.setMode('broadcast'); // Volver a la transmisión general durante la acción rápida
    }

    // Transición interpolada fluida (Lerp) de la cámara hacia los objetivos calculados
    this.camera.position.lerp(this.targetPos, dt * this.transitionSpeed);
    
    const currentLook = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).add(this.camera.position);
    currentLook.lerp(this.lookPos, dt * this.transitionSpeed * 1.5);
    this.camera.lookAt(currentLook);
  }
}

window.CinematicDirector = CinematicDirector;

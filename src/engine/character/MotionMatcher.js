/**
 * MotionMatcher - Selector de animaciones inteligente basado en contexto de juego y emparejamiento físico.
 */
class MotionMatcher {
  constructor(playerInstance, motionDatabase) {
    this.player = playerInstance;
    this.db = motionDatabase;
  }

  /**
   * Evalúa la situación de juego y selecciona la animación más adecuada para su ejecución.
   */
  match(dt, targetVelocity, ballPos, stamina) {
    if (!this.player.glbLoaded || !this.player.anim) return;

    const speed = targetVelocity.length();
    const distanceToBall = ballPos ? this.player.mesh.position.distanceTo(ballPos) : 999;

    // Conexión con fatiga (si la stamina es baja, reducimos velocidad de animación)
    let fatigueFactor = 1.0;
    if (stamina < 30) {
      fatigueFactor = 0.75; // Animaciones más lentas/pesadas
    }

    // 1. Evaluar si se debe reproducir una animación de golpeo
    if (this.player.isSwinging) {
      // Dejar que el flujo de swing controle la acción temporalmente
      return;
    }

    // 2. Determinar locomoción de pádel en base a dirección de movimiento
    let targetAnim = 'Idle';
    
    // Obtener vector de movimiento relativo para diferenciar paso cruzado, shuffle lateral o retroceso
    const localVel = targetVelocity.clone().applyQuaternion(this.player.mesh.quaternion.clone().invert());
    
    if (speed > 7.0) {
      targetAnim = AnimationLibrary.getClipName('locomotion', 'sprint');
    } else if (speed > 3.0) {
      targetAnim = AnimationLibrary.getClipName('locomotion', 'jog');
    } else if (speed > 0.3) {
      // Discriminar paso según dirección local
      if (Math.abs(localVel.x) > Math.abs(localVel.z)) {
        targetAnim = AnimationLibrary.getClipName('locomotion', 'sideShuffle');
      } else if (localVel.z > 0) {
        targetAnim = AnimationLibrary.getClipName('locomotion', 'backPedal');
      } else {
        targetAnim = AnimationLibrary.getClipName('locomotion', 'walk');
      }
    } else if (distanceToBall < 4.0) {
      targetAnim = AnimationLibrary.getClipName('locomotion', 'ready');
    }

    // Cambiar de animación suavemente
    const action = this.player.anim.actions[targetAnim];
    if (action) {
      this.player.anim.fadeTo(targetAnim, 0.2);
      action.setEffectiveTimeScale(fatigueFactor); // Aplicar fatiga
    }
  }
}

window.MotionMatcher = MotionMatcher;

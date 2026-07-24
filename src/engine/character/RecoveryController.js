/**
 * RecoveryController - Gestiona la transición y pasos de recuperación del jugador tras un golpe.
 */
class RecoveryController {
  constructor(playerInstance) {
    this.player = playerInstance;
    this.inRecovery = false;
    this.timer = 0;
  }

  /**
   * Inicia el proceso de recuperación de pose.
   */
  startRecovery() {
    this.inRecovery = true;
    this.timer = 0.6; // Duración en segundos de la recuperación
    this.player.playAnimation(AnimationLibrary.getClipName('locomotion', 'recovery'));
  }

  update(dt) {
    if (!this.inRecovery) return;

    this.timer -= dt;
    if (this.timer <= 0) {
      this.inRecovery = false;
      this.player.playAnimation(AnimationLibrary.getClipName('locomotion', 'ready'));
    }
  }
}

window.RecoveryController = RecoveryController;

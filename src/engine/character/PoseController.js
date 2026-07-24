/**
 * PoseController - Ajusta micro-rotaciones articulares en hombros, caderas y columna.
 */
class PoseController {
  constructor(rig) {
    this.rig = rig;
  }

  /**
   * Modifica sutilmente la columna y hombros para reflejar la torsión previa al golpe.
   */
  applyPreShotPose(isDominantRight = true, swingPhase = 0) {
    if (!this.rig) return;

    const spine = this.rig.bones.spine;
    const rightArm = this.rig.bones.rightArm;
    const leftArm = this.rig.bones.leftArm;

    if (swingPhase > 0 && swingPhase < Math.PI) {
      const swingT = Math.sin(swingPhase);

      // Rotación de columna preparatoria
      if (spine) {
        spine.rotation.y = THREE.MathUtils.lerp(spine.rotation.y, (isDominantRight ? -0.4 : 0.4) * swingT, 0.2);
      }

      // Preparación de hombro/brazo de golpeo
      const dominantArm = isDominantRight ? rightArm : leftArm;
      if (dominantArm) {
        dominantArm.rotation.x = THREE.MathUtils.lerp(dominantArm.rotation.x, -0.6 * swingT, 0.2);
      }
    }
  }
}

window.PoseController = PoseController;

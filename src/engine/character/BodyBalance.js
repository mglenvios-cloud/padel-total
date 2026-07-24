/**
 * BodyBalance - Gestiona el equilibrio, inclinación y transferencia de peso corporal.
 */
class BodyBalance {
  constructor(mesh, rig) {
    this.mesh = mesh;
    this.rig = rig;
  }

  applyBalance(velocity) {
    if (!velocity) return;

    // Inclinación corporal (Body Lean) en base a vectores
    const leanFactorZ = -velocity.z * 0.04;
    const leanFactorX = -velocity.x * 0.04;

    this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, leanFactorZ, 0.1);
    this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, leanFactorX, 0.1);

    // Rotación sutil de cadera y hombros si están en el Rig
    if (this.rig) {
      const hips = this.rig.bones.hips;
      const spine = this.rig.bones.spine;

      if (hips) {
        hips.rotation.z = THREE.MathUtils.lerp(hips.rotation.z, -leanFactorX * 0.5, 0.15);
      }
      if (spine) {
        spine.rotation.y = THREE.MathUtils.lerp(spine.rotation.y, leanFactorX * 0.3, 0.15);
      }
    }
  }
}

window.BodyBalance = BodyBalance;

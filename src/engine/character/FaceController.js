/**
 * FaceController - Manejador de expresiones faciales, pestañeo y respiración.
 */
class FaceController {
  constructor(mesh) {
    this.mesh = mesh;
    this.blinkTimer = Math.random() * 3 + 1;
    this.breathTime = 0;
  }

  update(dt) {
    this.breathTime += dt;
    this.blinkTimer -= dt;

    // 1. Pestañeo estocástico
    if (this.blinkTimer <= 0) {
      const eyesMesh = this.mesh.getObjectByName('Eyes') || this.mesh.getObjectByName('LeftEye') || this.mesh.getObjectByName('RightEye');
      if (eyesMesh) {
        eyesMesh.scale.y = 0.1;
        setTimeout(() => { eyesMesh.scale.y = 1.0; }, 85);
      }
      this.blinkTimer = Math.random() * 4 + 2;
    }

    // 2. Respiración procedural
    const chestMesh = this.mesh.getObjectByName('Torso') || this.mesh.getObjectByName('Spine') || this.mesh.children[0];
    if (chestMesh) {
      const breathScale = 1.0 + Math.sin(this.breathTime * 2.5) * 0.015;
      chestMesh.scale.x = breathScale;
      chestMesh.scale.z = breathScale;
    }
  }
}

window.FaceController = FaceController;

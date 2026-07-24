/**
 * MotionController - Registra la velocidad y calcula la dirección del personaje.
 */
class MotionController {
  constructor(mesh) {
    this.mesh = mesh;
    this.velocity = new THREE.Vector3();
    this.speed = 0;
  }

  update(dt, velocity) {
    if (velocity) {
      this.velocity.copy(velocity);
      this.speed = velocity.length();
    } else {
      this.velocity.set(0, 0, 0);
      this.speed = 0;
    }
  }
}

window.MotionController = MotionController;

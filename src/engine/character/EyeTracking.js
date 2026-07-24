/**
 * EyeTracking - Controla el seguimiento visual dinámico de los ojos hacia un objetivo.
 */
class EyeTracking {
  constructor(rig) {
    this.rig = rig;
  }

  trackTarget(targetPos) {
    if (!this.rig) return;

    // Buscar mallas oculares en la jerarquía del Rig
    const leftEye = this.rig.scene.getObjectByName('LeftEye') || this.rig.scene.getObjectByName('EyeL');
    const rightEye = this.rig.scene.getObjectByName('RightEye') || this.rig.scene.getObjectByName('EyeR');

    [leftEye, rightEye].forEach(eye => {
      if (eye) {
        const localTarget = eye.parent.worldToLocal(targetPos.clone());
        eye.lookAt(localTarget);
        
        // Limitar la desviación de la mirada para que no se crucen los ojos
        eye.rotation.x = Math.max(-0.25, Math.min(0.25, eye.rotation.x));
        eye.rotation.y = Math.max(-0.25, Math.min(0.25, eye.rotation.y));
        eye.rotation.z = 0;
      }
    });
  }
}

window.EyeTracking = EyeTracking;

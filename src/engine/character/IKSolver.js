/**
 * IKSolver - Solucionador de Cinemática Inversa para cuello y extremidades.
 */
class IKSolver {
  constructor(rig) {
    this.rig = rig;
  }

  /**
   * Resuelve el seguimiento de mirada de la cabeza (LookAt).
   */
  solveLookAt(targetPosition) {
    if (!this.rig) return;
    const head = this.rig.bones.head;
    if (!head) return;

    const worldPos = new THREE.Vector3();
    head.getWorldPosition(worldPos);

    const localTarget = head.parent.worldToLocal(targetPosition.clone());
    head.lookAt(localTarget);

    // Limitar rotación fisiológicamente
    head.rotation.x = Math.max(-0.6, Math.min(0.6, head.rotation.x));
    head.rotation.y = Math.max(-1.0, Math.min(1.0, head.rotation.y));
    head.rotation.z = 0;
  }

  /**
   * Foot IK / Ajuste contra el plano del suelo de la pista.
   */
  solveFootIK(floorHeight = 0) {
    if (!this.rig) return;
    const leftLeg = this.rig.bones.leftLeg;
    const rightLeg = this.rig.bones.rightLeg;

    // Lógica básica de alineación de piernas
    if (leftLeg && leftLeg.position.y < floorHeight) {
      leftLeg.position.y = floorHeight;
    }
    if (rightLeg && rightLeg.position.y < floorHeight) {
      rightLeg.position.y = floorHeight;
    }
  }
}

window.IKSolver = IKSolver;

/**
 * CrowdManager - Gestiona al público del estadio (1000+ espectadores instanciados de forma óptima).
 */
class CrowdManager {
  constructor(scene) {
    this.scene = scene;
    this.headMesh = null;
    this.bodyMesh = null;
    this.positions = [];
    this.count = 0;
  }

  build(spectatorCount = 1024) {
    this.count = spectatorCount;

    // Crear geometrías base simplificadas para instanciar
    const headGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const bodyGeo = new THREE.CylinderGeometry(0.02, 0.14, 0.38, 5);

    const headMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.6 });
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1c3a6b, roughness: 0.7 });

    this.headMesh = new THREE.InstancedMesh(headGeo, headMat, spectatorCount);
    this.bodyMesh = new THREE.InstancedMesh(bodyGeo, bodyMat, spectatorCount);

    this.headMesh.castShadow = true;
    this.bodyMesh.castShadow = true;

    // Distribuir asientos alrededor de la pista
    const dummy = new THREE.Object3D();
    for (let i = 0; i < spectatorCount; i++) {
      // Repartir en gradas laterales e izquierdas/derechas (Z de -15 a 15, X de -8 a -14, y 8 a 14)
      const isRight = Math.random() > 0.5;
      const x = (isRight ? 1 : -1) * (7.5 + Math.random() * 5.0);
      const z = (Math.random() - 0.5) * 26.0;
      const height = (Math.abs(x) - 7.0) * 0.75 + Math.random() * 0.15; // Grada escalonada
      
      const rotY = isRight ? -Math.PI / 2 : Math.PI / 2;

      this.positions.push({ x, y: height, z, rotY });

      // Cabeza
      dummy.position.set(x, height + 0.38, z);
      dummy.rotation.set(0, rotY, 0);
      dummy.updateMatrix();
      this.headMesh.setMatrixAt(i, dummy.matrix);

      // Torso
      dummy.position.set(x, height + 0.1, z);
      dummy.rotation.set(0, rotY, 0);
      dummy.updateMatrix();
      this.bodyMesh.setMatrixAt(i, dummy.matrix);
    }

    this.headMesh.instanceMatrix.needsUpdate = true;
    this.bodyMesh.instanceMatrix.needsUpdate = true;

    this.scene.add(this.headMesh);
    this.scene.add(this.bodyMesh);
  }

  /**
   * Actualiza el movimiento de la afición (aplausos, celebraciones) proceduralmente.
   */
  update(frame) {
    if (!this.headMesh || !this.bodyMesh) return;

    const time = frame * 0.07;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < this.count; i++) {
      const pos = this.positions[i];
      
      // Simular saltos/aplausos en base a funciones seno desfasadas
      const offset = Math.sin(time + i * 0.4) * 0.05;

      // Cabeza animada
      dummy.position.set(pos.x, pos.y + 0.38 + Math.max(0, offset), pos.z);
      dummy.rotation.set(0, pos.rotY, 0);
      dummy.updateMatrix();
      this.headMesh.setMatrixAt(i, dummy.matrix);

      // Torso animado
      dummy.position.set(pos.x, pos.y + 0.1 + Math.max(0, offset), pos.z);
      dummy.rotation.set(0, pos.rotY, 0);
      dummy.updateMatrix();
      this.bodyMesh.setMatrixAt(i, dummy.matrix);
    }

    this.headMesh.instanceMatrix.needsUpdate = true;
    this.bodyMesh.instanceMatrix.needsUpdate = true;
  }
}

window.CrowdManager = CrowdManager;

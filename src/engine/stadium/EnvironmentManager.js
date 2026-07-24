/**
 * EnvironmentManager - Dibuja el entorno del estadio (gradas de metal, palcos VIP, etc.).
 */
class EnvironmentManager {
  constructor(scene) {
    this.scene = scene;
  }

  buildStadiumShell() {
    const group = new THREE.Group();
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x181a1e, roughness: 0.9 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x33373d, metalness: 0.8, roughness: 0.2 });

    // Estructuras de soporte para gradas laterales
    const standRight = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 30), concreteMat);
    standRight.position.set(11, 1, 0);
    group.add(standRight);

    const standLeft = standRight.clone();
    standLeft.position.x = -11;
    group.add(standLeft);

    // Barandillas metálicas
    const railRight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.1, 30), metalMat);
    railRight.position.set(7.9, 2.5, 0);
    group.add(railRight);

    const railLeft = railRight.clone();
    railLeft.position.x = -7.9;
    group.add(railLeft);

    this.scene.add(group);
    return group;
  }
}

window.EnvironmentManager = EnvironmentManager;

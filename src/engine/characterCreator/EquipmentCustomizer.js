/**
 * EquipmentCustomizer - Acopla palas y calzado específicos a los huesos de las manos/pies.
 */
class EquipmentCustomizer {
  constructor() {
    this.equippedPaddleId = 'base';
  }

  attachPaddleToHand(handBone, paddleId) {
    if (!handBone) return;

    this.equippedPaddleId = paddleId;

    // Limpiar pala anterior
    const prev = handBone.getObjectByName('player_paddle_mesh');
    if (prev) handBone.remove(prev);

    // Crear pala procedimental representativa
    const paddleGroup = new THREE.Group();
    paddleGroup.name = 'player_paddle_mesh';

    // Mango
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    grip.position.y = -0.1;
    paddleGroup.add(grip);

    // Cabeza de la pala
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.03), new THREE.MeshStandardMaterial({ color: 0xd40000, roughness: 0.2 }));
    head.position.y = 0.1;
    paddleGroup.add(head);

    paddleGroup.rotation.x = Math.PI / 2; // Orientar correctamente en la mano del rig
    handBone.add(paddleGroup);

    console.log(`EquipmentCustomizer: Pala '${paddleId}' acoplada a la mano del jugador.`);
  }
}

window.EquipmentCustomizer = EquipmentCustomizer;

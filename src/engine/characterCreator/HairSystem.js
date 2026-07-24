/**
 * HairSystem - Administra los estilos, colores y mallas de peinado vinculados a la cabeza.
 */
class HairSystem {
  constructor() {
    this.activeStyle = 'hair_sport_01';
    this.color = 0x332211; // Castaño oscuro
  }

  attachHairToHead(headBone, styleId, colorHex) {
    if (!headBone) return;

    this.activeStyle = styleId;
    this.color = colorHex;

    // Limpiar cabellos anteriores
    const prev = headBone.getObjectByName('player_hair_node');
    if (prev) headBone.remove(prev);

    // Crear un peinado estilizado simplificado procedimental
    const hairGeo = new THREE.SphereGeometry(0.13, 8, 8);
    const hairMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.8 });
    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
    hairMesh.name = 'player_hair_node';
    hairMesh.position.set(0, 0.08, 0); // Ajuste relativo al cráneo

    headBone.add(hairMesh);
    console.log(`HairSystem: Cabello '${styleId}' acoplado al hueso de la cabeza.`);
  }
}

window.HairSystem = HairSystem;

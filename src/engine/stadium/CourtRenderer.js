/**
 * CourtRenderer - Se encarga del dibujo y materiales PBR de la pista (césped, cristales, red).
 */
class CourtRenderer {
  constructor(scene, envMap) {
    this.scene = scene;
    this.envMap = envMap;
  }

  build(width = 10, length = 20) {
    const courtGroup = new THREE.Group();

    // 1. Césped artificial PBR con desgaste
    const grassGeo = new THREE.PlaneGeometry(width * 1.2, length * 1.1);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x054f2a,
      roughness: 0.85,
      metalness: 0.1,
      envMap: this.envMap,
      envMapIntensity: 0.3
    });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;
    courtGroup.add(grass);

    // 2. Líneas pintadas reglamentarias
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0.0 });
    const baseline1 = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.08), lineMat);
    baseline1.rotation.x = -Math.PI / 2;
    baseline1.position.set(0, 0.001, -length / 2);
    courtGroup.add(baseline1);

    const baseline2 = baseline1.clone();
    baseline2.position.z = length / 2;
    courtGroup.add(baseline2);

    // 3. Cristales reglamentarios AAA (reflejos y transparencia)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.18,
      roughness: 0.1,
      metalness: 0.9,
      envMap: this.envMap,
      envMapIntensity: 2.2,
      side: THREE.DoubleSide
    });
    
    // Muro de fondo trasero (Z = 10)
    const glassBack = new THREE.Mesh(new THREE.BoxGeometry(width, 3.0, 0.04), glassMat);
    glassBack.position.set(0, 1.5, length / 2);
    courtGroup.add(glassBack);

    const glassFront = glassBack.clone();
    glassFront.position.z = -length / 2;
    courtGroup.add(glassFront);

    this.scene.add(courtGroup);
    return courtGroup;
  }
}

window.CourtRenderer = CourtRenderer;

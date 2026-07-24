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
    // Nota: El suelo oficial azul WPT se construye en GameRenderer3D._buildCourt()
    // para evitar Z-fighting (parpadeo de color verde/azul) y doble renderizado.

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

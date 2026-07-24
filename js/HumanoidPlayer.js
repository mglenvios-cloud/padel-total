/**
 * HumanoidPlayer - Fachada principal del jugador.
 * Gestiona el modelo GLB cargado (con Rig, Animaciones y Personalización)
 * o realiza un fallback transparente al modelo procedural de cilindros y cajas si el GLB no está listo.
 */
class HumanoidPlayer {
  constructor(config, loader, scene) {
    this.id = config.id;
    this.team = config.team;
    this.isHuman = config.isHuman;
    this.color = config.color;
    this.name = config.name;
    this.gender = config.gender || 'male'; // 'male' | 'female' | 'referee' | 'coach'
    this.role = config.role || 'player';    // 'player' | 'referee' | 'coach'

    this.loader = loader;
    this.scene = scene;

    this.glbLoaded = false;
    this.mesh = new THREE.Group(); // Contenedor raíz
    this.mesh.position.set(config.x || 0, 0, config.z || 0);

    // Guardar referencia en userData
    this.mesh.userData.playerObj = this;

    // Componentes del Rig y Animación (para GLB)
    this.rig = null;
    this.anim = null;
    this.glbScene = null;

    // Guardar mesh procedural como Fallback inmediato
    this.proceduralMesh = null;

    this.init();
  }

  /**
   * Inicializa la carga del modelo o el fallback procedural.
   */
  async init() {
    // 1. Crear el fallback procedural de inmediato para evitar que el juego falle
    this.createProceduralFallback();
    this.mesh.add(this.proceduralMesh);

    // 2. Determinar la URL del GLB según género y rol
    let url = '';
    if (this.role === 'referee') {
      url = 'assets/players/referee/referee.glb';
    } else if (this.role === 'coach') {
      url = 'assets/players/coach/coach.glb';
    } else {
      // Distribución de modelos para jugadores profesionales
      if (this.gender === 'female') {
        url = this.id === 1 ? 'assets/players/female/pro01.glb' : 'assets/players/female/pro02.glb';
      } else {
        // Hombres (pro01, pro02, pro03)
        if (this.id === 0) url = 'assets/players/male/pro01.glb';
        else if (this.id === 2) url = 'assets/players/male/pro02.glb';
        else url = 'assets/players/male/pro03.glb';
      }
    }

    try {
      console.log(`HumanoidPlayer: Intentando cargar GLB para ${this.name}: ${url}`);
      const gltf = await this.loader.loadModel(url);
      this.setupGLB(gltf);
    } catch (e) {
      console.warn(`HumanoidPlayer: No se pudo cargar el GLB (${url}). Usando fallback procedural.`, e.message);
    }
  }

  /**
   * Configura el modelo GLB cargado, reemplaza el fallback y aplica el Rig.
   */
  setupGLB(gltf) {
    this.glbScene = gltf.scene;
    
    // Configurar sombras
    this.glbScene.traverse(node => {
      if (node.isMesh || node.isSkinnedMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    // Reemplazar la representación visual
    this.mesh.remove(this.proceduralMesh);
    this.mesh.add(this.glbScene);

    // Configurar Rig y Animaciones
    this.rig = new PlayerRig(this.glbScene, this.isHuman);
    this.anim = new AnimationController(this.glbScene, gltf.animations);
    this.glbLoaded = true;

    // Aplicar personalización por defecto
    this.applyCustomization();
  }

  /**
   * Genera el personaje procedural actual (Cilindros, cajas y esferas)
   */
  createProceduralFallback() {
    const group = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.55 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.5 });
    const shortsMat = new THREE.MeshStandardMaterial({ color: 0x1b1f26, roughness: 0.7 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xfcfcfc, roughness: 0.4 });
    const accessoryMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.55, 8), shirtMat);
    torso.position.y = 1.1;
    torso.castShadow = true;
    group.add(torso);

    // Cabeza
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), skinMat);
    head.position.y = 1.6;
    head.castShadow = true;
    group.add(head);

    // Shorts
    const shortsHip = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.26), shortsMat);
    shortsHip.position.y = 0.78;
    group.add(shortsHip);

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.12, 0.66, 0);
    const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.05, 0.28, 8), skinMat);
    leftThigh.position.y = -0.14;
    leftLegGroup.add(leftThigh);
    const leftCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.24, 8), skinMat);
    leftCalf.position.set(0, -0.38, 0);
    leftLegGroup.add(leftCalf);
    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.16), shoeMat);
    leftShoe.position.set(0, -0.52, 0.02);
    leftLegGroup.add(leftShoe);
    group.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.12, 0.66, 0);
    const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.05, 0.28, 8), skinMat);
    rightThigh.position.y = -0.14;
    rightLegGroup.add(rightThigh);
    const rightCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.24, 8), skinMat);
    rightCalf.position.set(0, -0.38, 0);
    rightLegGroup.add(rightCalf);
    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.16), shoeMat);
    rightShoe.position.set(0, -0.52, 0.02);
    rightLegGroup.add(rightShoe);
    group.add(rightLegGroup);

    // Brazos
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.28, 1.25, 0);
    const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.038, 0.24, 8), skinMat);
    leftUpperArm.position.y = -0.12;
    leftArmPivot.add(leftUpperArm);
    group.add(leftArmPivot);

    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.28, 1.25, 0);
    const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.038, 0.24, 8), skinMat);
    rightUpperArm.position.y = -0.12;
    rightArmPivot.add(rightUpperArm);
    group.add(rightArmPivot);

    // Guardar referencias internas para animación
    group.userData.leftLeg = leftLegGroup;
    group.userData.rightLeg = rightLegGroup;
    group.userData.rightArmPivot = rightArmPivot;

    this.proceduralMesh = group;
  }

  /**
   * Aplica personalización a los materiales del esqueleto GLB.
   */
  applyCustomization() {
    if (!this.glbLoaded || !this.rig) return;

    // Personalizar según los nombres de los sub-meshes del GLB
    this.rig.customizeMaterial('shirt', { color: this.color });
    this.rig.customizeMaterial('pants', { color: 0x1b1f26 });
    this.rig.customizeMaterial('shoes', { color: 0xfcfcfc });
    this.rig.customizeMaterial('cap', { color: 0xffffff });
    
    // Crear una pala procedural 3D y acoplarla al hueso de la mano derecha si existe
    this.attachPaddle();
  }

  /**
   * Crea una pala 3D y la acopla al Rig.
   */
  attachPaddle() {
    if (!this.glbLoaded || !this.rig) return;

    const paddleGroup = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
    const faceMat = new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.5 });
    const gripMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.8 });

    // Cara de la pala
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.02, 16), faceMat);
    head.rotation.x = Math.PI / 2;
    head.position.y = 0.24;
    paddleGroup.add(head);

    // Marco exterior
    const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.022, 16, 1, true), frameMat);
    frame.rotation.x = Math.PI / 2;
    frame.position.y = 0.24;
    paddleGroup.add(frame);

    // Mango
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 8), gripMat);
    handle.position.y = 0.08;
    paddleGroup.add(handle);

    // Ajustar offsets según el origen del esqueleto (ej: mano derecha)
    const positionOffset = new THREE.Vector3(0, -0.05, 0.05);
    const rotationOffset = new THREE.Euler(Math.PI / 2, 0, 0);

    this.rig.attachObject('rightHand', paddleGroup, positionOffset, rotationOffset);
  }

  /**
   * Permite actualizar la personalización del jugador externamente.
   */
  customize(options) {
    if (options.color !== undefined) {
      this.color = options.color;
      if (this.proceduralMesh) {
        // Actualizar material del torso procedural
        this.proceduralMesh.children[0].material.color.set(this.color);
      }
      this.applyCustomization();
    }
  }

  /**
   * Obtiene la malla de Three.js.
   */
  getMesh() {
    return this.mesh;
  }

  /**
   * Solicita una animación al controlador.
   */
  playAnimation(name) {
    if (this.glbLoaded && this.anim) {
      this.anim.fadeTo(name, 0.15);
    }
  }

  update(dt, velocity, ballPos, cameraPos) {
    const speed = velocity ? velocity.length() : 0;

    // Inicializar timers si no existen
    if (this.sweatTime === undefined) this.sweatTime = 0;
    if (this.blinkTimer === undefined) this.blinkTimer = Math.random() * 3 + 1;
    this.sweatTime += dt;

    if (this.glbLoaded && this.anim) {
      // 1. Actualizar locomoción (Idle/Walk/Run/Sprint/Ready)
      this.anim.updateLocomotion(speed);

      // 2. Calcular distancia a la cámara para el LOD
      let distance = 0;
      if (cameraPos) {
        distance = this.mesh.position.distanceTo(cameraPos);
      }
      this.anim.update(dt, distance);

      // 3. Orientar cabeza procedimentalmente (IK) hacia la pelota si está cerca
      if (ballPos && this.rig) {
        this.rig.lookAt(ballPos);
      }

      // 4. Inclinación corporal dinámica (Body Lean) según la velocidad de carrera
      if (velocity) {
        const leanFactorZ = -velocity.z * 0.04;
        const leanFactorX = -velocity.x * 0.04;
        this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, leanFactorZ, 0.1);
        this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, leanFactorX, 0.1);
      }

      // 5. Simular sudor dinámico sobre la piel (aumento de brillo/especularidad)
      if (this.customizer && this.customizer.materialManager) {
        const sweatIntensity = Math.min(0.5, this.sweatTime * 0.005); // Crece progresivamente durante el partido
        this.customizer.materialManager.applyToMesh(this.mesh, 'skin', {
          roughness: 0.55 - sweatIntensity * 0.7, // Piel más húmeda y reflectante
          metalness: sweatIntensity * 0.25
        });
      }

      // 6. Simulación de Parpadeo Facial Físico (Blinking)
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0) {
        const eyesMesh = this.mesh.getObjectByName('Eyes') || this.mesh.getObjectByName('LeftEye');
        if (eyesMesh) {
          eyesMesh.scale.y = 0.1; // Parpadeo rápido
          setTimeout(() => { eyesMesh.scale.y = 1.0; }, 80);
        }
        this.blinkTimer = Math.random() * 4 + 2; // Siguiente parpadeo en 2 a 6 segundos
      }
    }
  }
}

// Exportar globalmente
window.HumanoidPlayer = HumanoidPlayer;

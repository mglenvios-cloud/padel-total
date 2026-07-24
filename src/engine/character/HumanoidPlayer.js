/**
 * HumanoidPlayer - Fachada principal del personaje.
 */
class HumanoidPlayer {
  constructor(config, loader, scene) {
    this.id = config.id;
    this.team = config.team;
    this.isHuman = config.isHuman;
    this.color = config.color;
    this.name = config.name;
    this.gender = config.gender || 'male';
    this.role = config.role || 'player';

    this.loader = loader;
    this.scene = scene;

    this.glbLoaded = false;
    this.mesh = new THREE.Group();
    this.mesh.position.set(config.x || 0, 0, config.z || 0);
    this.mesh.userData.playerObj = this;

    this.rig = null;
    this.anim = null;
    this.glbScene = null;
    this.proceduralMesh = null;

    // Componentes del AAA Character Engine
    this.motion = new MotionController(this.mesh);
    this.balance = null;
    this.ik = null;
    this.face = new FaceController(this.mesh);
    this.eye = null;
    this.equipment = null;
    this.lod = null;

    this.init();
  }

  async init() {
    this.createProceduralFallback();
    this.mesh.add(this.proceduralMesh);

    let url = '';
    if (this.role === 'referee') {
      url = 'assets/players/referee/referee.glb';
    } else if (this.role === 'coach') {
      url = 'assets/players/coach/coach.glb';
    } else {
      if (this.gender === 'female') {
        url = this.id === 1 ? 'assets/players/female/pro01.glb' : 'assets/players/female/pro02.glb';
      } else {
        if (this.id === 0) url = 'assets/players/male/pro01.glb';
        else if (this.id === 2) url = 'assets/players/male/pro02.glb';
        else url = 'assets/players/male/pro03.glb';
      }
    }

    try {
      const gltf = await this.loader.loadModel(url);
      this.setupGLB(gltf);
    } catch (e) {
      console.warn(`AAA CharacterEngine: Fallback procedural para ${this.name}`, e.message);
    }
  }

  setupGLB(gltf) {
    this.glbScene = gltf.scene;
    this.glbScene.traverse(node => {
      if (node.isMesh || node.isSkinnedMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    this.mesh.remove(this.proceduralMesh);
    this.mesh.add(this.glbScene);

    // Inicializar Rig
    this.rig = new RigController(this.glbScene);
    this.anim = new AnimationController(this.glbScene, gltf.animations);
    this.blendTree = new BlendTree(this.anim);

    this.glbLoaded = true;
  }

  createProceduralFallback() {
    const group = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.6 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.4 });
    const shortsMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.5 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const racketMat = new THREE.MeshStandardMaterial({ color: 0x00d4ff, metalness: 0.8, roughness: 0.2 });

    // Cabeza
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), skinMat);
    head.position.y = 1.68;
    head.castShadow = true;
    group.add(head);

    // Torso (Camiseta)
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.52, 10), shirtMat);
    torso.position.y = 1.28;
    torso.castShadow = true;
    group.add(torso);

    // Pantalón corto
    const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.18, 0.22, 10), shortsMat);
    shorts.position.y = 0.94;
    shorts.castShadow = true;
    group.add(shorts);

    // Pierna Izquierda (Cadera en Y=0.88, llega hasta Y=0.0)
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.11, 0.88, 0);
    const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.42, 8), skinMat);
    leftThigh.position.y = -0.21;
    leftThigh.castShadow = true;
    leftLegGroup.add(leftThigh);
    const leftCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.42, 8), skinMat);
    leftCalf.position.y = -0.63;
    leftCalf.castShadow = true;
    leftLegGroup.add(leftCalf);
    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.22), shoeMat);
    leftShoe.position.set(0, -0.84, 0.04);
    leftShoe.castShadow = true;
    leftLegGroup.add(leftShoe);
    group.add(leftLegGroup);

    // Pierna Derecha
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.11, 0.88, 0);
    const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.42, 8), skinMat);
    rightThigh.position.y = -0.21;
    rightThigh.castShadow = true;
    rightLegGroup.add(rightThigh);
    const rightCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.42, 8), skinMat);
    rightCalf.position.y = -0.63;
    rightCalf.castShadow = true;
    rightLegGroup.add(rightCalf);
    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.22), shoeMat);
    rightShoe.position.set(0, -0.84, 0.04);
    rightShoe.castShadow = true;
    rightLegGroup.add(rightShoe);
    group.add(rightLegGroup);

    // Brazo Derecho + Pala de Pádel
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.24, 1.45, 0);
    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.45, 8), shirtMat);
    rightArm.position.set(0.08, -0.18, 0.1);
    rightArm.rotation.z = -Math.PI / 8;
    rightArm.rotation.x = Math.PI / 6;
    rightArmGroup.add(rightArm);
    
    // Pala de pádel en la mano
    const racketHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.2, 8), shoeMat);
    racketHandle.position.set(0.18, -0.32, 0.32);
    racketHandle.rotation.x = Math.PI / 3;
    rightArmGroup.add(racketHandle);
    const racketHead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.3, 0.03), racketMat);
    racketHead.position.set(0.18, -0.42, 0.48);
    racketHead.rotation.x = Math.PI / 3;
    rightArmGroup.add(racketHead);

    group.add(rightArmGroup);

    // Guardar referencias para animación
    this.mesh.userData.leftLeg = leftLegGroup;
    this.mesh.userData.rightLeg = rightLegGroup;
    this.mesh.userData.rightArm = rightArmGroup;

    this.proceduralMesh = group;
  }

  getMesh() {
    return this.mesh;
  }

  playAnimation(name) {
    if (this.glbLoaded && this.anim) {
      this.anim.fadeTo(name, 0.15);
    }
  }

  update(dt, velocity, ballPos, cameraPos) {
    this.motion.update(dt, velocity);

    // Conexión con fatiga: obtener stamina del objeto de lógica (fallback a 100 si no existe)
    const stamina = this.mesh.parent && this.mesh.parent.userData && this.mesh.parent.userData.playerObj
      ? this.mesh.parent.userData.playerObj.stamina
      : 100;

    if (this.glbLoaded && this.anim) {
      // 1. Motion Matching para locomoción
      if (this.matcher) {
        this.matcher.match(dt, this.motion.velocity, ballPos, stamina);
      } else if (this.blendTree) {
        this.blendTree.updateLocomotion(this.motion.speed);
      }

      // 2. LOD
      let distance = 0;
      if (cameraPos) {
        distance = this.mesh.position.distanceTo(cameraPos);
      }
      this.anim.update(dt, distance);

      // 3. Pose y torsión articular
      if (this.pose) {
        const swingPhase = this.mesh.userData.swingPhase || 0;
        this.pose.applyPreShotPose(this.dominantHand !== 'left', swingPhase);
      }

      // 4. Recovery Steps tras golpear
      if (this.recovery) {
        this.recovery.update(dt);
      }

      // 5. Face expressions/blinking
      if (this.face) {
        this.face.update(dt);
      }

      // 6. Eye Tracking & LookAt IK
      if (ballPos) {
        if (this.eye) this.eye.trackTarget(ballPos);
        if (this.ik) this.ik.solveLookAt(ballPos);
      }

      // 7. Body Balance & Lean
      if (this.balance) {
        this.balance.applyBalance(velocity);
      }
    }
  }
}

window.HumanoidPlayer = HumanoidPlayer;

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
    
    // Materiales PBR de alta definición
    const skinMat   = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.55, metalness: 0.05 });
    const hairMat   = new THREE.MeshStandardMaterial({ color: 0x2c1d11, roughness: 0.85 });
    const shirtMat  = new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.35, metalness: 0.1 });
    const shortsMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 });
    const sockMat   = new THREE.MeshStandardMaterial({ color: 0xf9fafb, roughness: 0.7 });
    const shoeMat   = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.2 });
    const soleMat   = new THREE.MeshStandardMaterial({ color: 0x00d4ff, roughness: 0.4 });
    const racketMat = new THREE.MeshStandardMaterial({ color: 0x00ff87, metalness: 0.7, roughness: 0.2 });
    const frameMat  = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });

    // 1. CABEZA & CUELLO
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.68;

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.135, 16, 14), skinMat);
    headMesh.scale.set(1.0, 1.15, 1.05);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Cabello / Gorra deportiva
    const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
    hairMesh.position.set(0, 0.02, -0.01);
    headGroup.add(hairMesh);

    // Gorra Visera opcional
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.015, 0.12), shirtMat);
    visor.position.set(0, 0.06, 0.14);
    visor.rotation.x = 0.15;
    headGroup.add(visor);

    // Cuello
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.12, 10), skinMat);
    neck.position.y = -0.12;
    headGroup.add(neck);

    group.add(headGroup);

    // 2. TORSO & PECHO ATLÉTICO
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 1.28;

    // Pecho / Camiseta
    const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.17, 0.46, 12), shirtMat);
    chest.castShadow = true;
    torsoGroup.add(chest);

    // Hombros (Deltoides)
    const leftShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), shirtMat);
    leftShoulder.position.set(-0.23, 0.18, 0);
    torsoGroup.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), shirtMat);
    rightShoulder.position.set(0.23, 0.18, 0);
    torsoGroup.add(rightShoulder);

    // Pantalón corto
    const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.185, 0.22, 12), shortsMat);
    shorts.position.y = -0.34;
    shorts.castShadow = true;
    torsoGroup.add(shorts);

    group.add(torsoGroup);

    // 3. PIERNA IZQUIERDA ARTICULADA (Cadera Y=0.88 -> Rodilla -> Tobillo Y=0.0)
    const leftHipGroup = new THREE.Group();
    leftHipGroup.position.set(-0.11, 0.88, 0);

    const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.40, 10), skinMat);
    leftThigh.position.y = -0.20;
    leftThigh.castShadow = true;
    leftHipGroup.add(leftThigh);

    // Articulación de Rodilla Izquierda (Joint)
    const leftKneeJoint = new THREE.Group();
    leftKneeJoint.position.set(0, -0.40, 0);

    const leftKneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), skinMat);
    leftKneeJoint.add(leftKneeCap);

    const leftCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.042, 0.38, 10), skinMat);
    leftCalf.position.y = -0.20;
    leftCalf.castShadow = true;
    leftKneeJoint.add(leftCalf);

    const leftSock = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.044, 0.12, 10), sockMat);
    leftSock.position.y = -0.34;
    leftKneeJoint.add(leftSock);

    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.075, 0.23), shoeMat);
    leftShoe.position.set(0, -0.44, 0.04);
    leftShoe.castShadow = true;
    leftKneeJoint.add(leftShoe);

    const leftSole = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.02, 0.24), soleMat);
    leftSole.position.set(0, -0.475, 0.04);
    leftKneeJoint.add(leftSole);

    leftHipGroup.add(leftKneeJoint);
    group.add(leftHipGroup);

    // 4. PIERNA DERECHA ARTICULADA
    const rightHipGroup = new THREE.Group();
    rightHipGroup.position.set(0.11, 0.88, 0);

    const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.40, 10), skinMat);
    rightThigh.position.y = -0.20;
    rightThigh.castShadow = true;
    rightHipGroup.add(rightThigh);

    // Articulación de Rodilla Derecha (Joint)
    const rightKneeJoint = new THREE.Group();
    rightKneeJoint.position.set(0, -0.40, 0);

    const rightKneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), skinMat);
    rightKneeJoint.add(rightKneeCap);

    const rightCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.042, 0.38, 10), skinMat);
    rightCalf.position.y = -0.20;
    rightCalf.castShadow = true;
    rightKneeJoint.add(rightCalf);

    const rightSock = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.044, 0.12, 10), sockMat);
    rightSock.position.y = -0.34;
    rightKneeJoint.add(rightSock);

    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.075, 0.23), shoeMat);
    rightShoe.position.set(0, -0.44, 0.04);
    rightShoe.castShadow = true;
    rightKneeJoint.add(rightShoe);

    const rightSole = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.02, 0.24), soleMat);
    rightSole.position.set(0, -0.475, 0.04);
    rightKneeJoint.add(rightSole);

    rightHipGroup.add(rightKneeJoint);
    group.add(rightHipGroup);

    // 5. BRAZO IZQUIERDO ARTICULADO (Equilibrio)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.24, 1.45, 0);
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, 0.24, 8), shirtMat);
    leftArm.position.set(-0.04, -0.10, 0.03);
    leftArmGroup.add(leftArm);

    const leftElbowJoint = new THREE.Group();
    leftElbowJoint.position.set(-0.04, -0.22, 0.03);
    const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.032, 0.22, 8), skinMat);
    leftForearm.position.y = -0.10;
    leftElbowJoint.add(leftForearm);
    leftArmGroup.add(leftElbowJoint);
    group.add(leftArmGroup);

    // 6. BRAZO DERECHO ARTICULADO + PALA DE PÁDEL PRO
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.24, 1.45, 0);

    const rightBiceps = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.044, 0.24, 10), shirtMat);
    rightBiceps.position.set(0.06, -0.10, 0.05);
    rightArmGroup.add(rightBiceps);

    // Articulación de Codo Derecho (Joint)
    const rightElbowJoint = new THREE.Group();
    rightElbowJoint.position.set(0.06, -0.22, 0.05);

    const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.036, 0.22, 10), skinMat);
    rightForearm.position.y = -0.10;
    rightForearm.castShadow = true;
    rightElbowJoint.add(rightForearm);

    // Empuñadura Grip
    const racketHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.22, 10), sockMat);
    racketHandle.position.set(0.02, -0.22, 0.12);
    racketHandle.rotation.x = Math.PI / 3;
    rightElbowJoint.add(racketHandle);

    // Cabeza de Pádel en forma de lágrima
    const racketHeadGeo = new THREE.CylinderGeometry(0.135, 0.115, 0.032, 18);
    racketHeadGeo.scale(1.0, 1.0, 1.38);
    const racketHead = new THREE.Mesh(racketHeadGeo, racketMat);
    racketHead.position.set(0.02, -0.34, 0.29);
    racketHead.rotation.x = Math.PI / 3;
    racketHead.castShadow = true;
    rightElbowJoint.add(racketHead);

    // Marco exterior protector
    const racketFrame = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.015, 8, 20), frameMat);
    racketFrame.position.set(0.02, -0.34, 0.29);
    racketFrame.rotation.x = Math.PI / 3;
    rightElbowJoint.add(racketFrame);

    rightArmGroup.add(rightElbowJoint);
    group.add(rightArmGroup);

    // Guardar referencias para el motor de animaciones y cinemática (IK/FK)
    this.mesh.userData.leftLeg = leftHipGroup;
    this.mesh.userData.rightLeg = rightHipGroup;
    this.mesh.userData.leftKnee = leftKneeJoint;
    this.mesh.userData.rightKnee = rightKneeJoint;
    this.mesh.userData.leftArm = leftArmGroup;
    this.mesh.userData.rightArm = rightArmGroup;
    this.mesh.userData.leftElbow = leftElbowJoint;
    this.mesh.userData.rightElbow = rightElbowJoint;

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

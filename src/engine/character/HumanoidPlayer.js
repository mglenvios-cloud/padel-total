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
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: this.color });

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.55, 8), shirtMat);
    torso.position.y = 1.1;
    torso.castShadow = true;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), skinMat);
    head.position.y = 1.6;
    head.castShadow = true;
    group.add(head);

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.12, 0.66, 0);
    const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.05, 0.28, 8), skinMat);
    leftThigh.position.y = -0.14;
    leftLegGroup.add(leftThigh);
    group.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.12, 0.66, 0);
    const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.05, 0.28, 8), skinMat);
    rightThigh.position.y = -0.14;
    rightLegGroup.add(rightThigh);
    group.add(rightLegGroup);

    group.userData.leftLeg = leftLegGroup;
    group.userData.rightLeg = rightLegGroup;

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

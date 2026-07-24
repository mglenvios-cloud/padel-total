/**
 * CharacterFactory - Factoría encargada de instanciar y ensamblar componentes.
 */
class CharacterFactory {
  constructor(loader, textureManager, materialManager) {
    this.loader = loader;
    this.textureManager = textureManager;
    this.materialManager = materialManager;
  }

  createPlayer(config, scene) {
    const player = new HumanoidPlayer(config, this.loader, scene);

    const originalSetupGLB = player.setupGLB.bind(player);
    player.setupGLB = (gltf) => {
      originalSetupGLB(gltf);

      // Inyectar sub-controladores del motor AAA
      player.equipment = new EquipmentManager(player.rig);
      player.lod = new LODManager(player.mesh, player.anim);
      player.customizer = new CharacterCustomizer(
        player, 
        this.textureManager, 
        this.materialManager, 
        player.equipment
      );
      player.ik = new IKSolver(player.rig);
      player.eye = new EyeTracking(player.rig);
      player.balance = new BodyBalance(player.mesh, player.rig);

      // FASE 11: Motion Capture & Motion Matching controllers
      player.motionDb = new MotionDatabase();
      player.matcher = new MotionMatcher(player, player.motionDb);
      player.pose = new PoseController(player.rig);
      player.recovery = new RecoveryController(player);

      player.attachPaddle = () => {
        if (!player.glbLoaded || !player.rig) return;

        const paddleGroup = new THREE.Group();
        const faceMat = new THREE.MeshStandardMaterial({ color: player.color, roughness: 0.5 });
        const gripMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.8 });

        const head = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.02, 16), faceMat);
        head.rotation.x = Math.PI / 2;
        head.position.y = 0.24;
        paddleGroup.add(head);

        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 8), gripMat);
        handle.position.y = 0.08;
        paddleGroup.add(handle);

        const boneName = player.dominantHand === 'left' ? 'leftHand' : 'rightHand';
        const positionOffset = new THREE.Vector3(0, -0.05, 0.05);
        const rotationOffset = new THREE.Euler(Math.PI / 2, 0, 0);

        player.equipment.equipItem('paddle', paddleGroup, boneName, positionOffset, rotationOffset);
      };

      const dbPreset = CharacterDatabase.getPreset(config.role || 'player', config.id);
      player.customizer.customize(dbPreset);
    };

    return player;
  }
}

window.CharacterFactory = CharacterFactory;

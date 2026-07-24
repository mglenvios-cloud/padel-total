/**
 * CharacterManager - Singleton que actúa como punto central y gestor del ciclo de vida de los personajes.
 */
class CharacterManager {
  constructor(loader, scene) {
    this.loader = loader;
    this.scene = scene;

    this.textureManager = new TextureManager();
    this.materialManager = new MaterialManager();
    this.factory = new CharacterFactory(this.loader, this.textureManager, this.materialManager);

    this.activeCharacters = new Map();
  }

  /**
   * Crea un nuevo personaje y lo registra.
   */
  createCharacter(config) {
    console.log(`CharacterManager: Creando personaje '${config.name}' con rol '${config.role || 'player'}'`);
    const player = this.factory.createPlayer(config, this.scene);
    this.activeCharacters.set(player.id, player);
    return player;
  }

  /**
   * Obtiene un personaje por su ID.
   */
  getCharacter(id) {
    return this.activeCharacters.get(id);
  }

  /**
   * Actualiza todos los personajes, controlando el movimiento, animaciones e IK/LOD de cada uno.
   */
  update(dt, ballPos, cameraPos) {
    this.activeCharacters.forEach(character => {
      if (character.glbLoaded && character.lod && cameraPos) {
        // Calcular distancia a la cámara para actualizar el LOD dinámicamente
        const dist = character.mesh.position.distanceTo(cameraPos);
        character.lod.updateLOD(dist);
      }

      // Obtener velocidad procedimental para actualizar el Blend Tree de animaciones
      const group = character.getMesh();
      const prevX = group.userData.lastX !== undefined ? group.userData.lastX : group.position.x;
      const prevZ = group.userData.lastZ !== undefined ? group.userData.lastZ : group.position.z;
      const dx = group.position.x - prevX;
      const dz = group.position.z - prevZ;
      const velocity = new THREE.Vector3(dx / dt, 0, dz / dt);

      group.userData.lastX = group.position.x;
      group.userData.lastZ = group.position.z;

      // Actualizar lógica interna
      character.update(dt, velocity, ballPos, cameraPos);
    });
  }

  /**
   * Limpia toda la memoria de texturas y materiales al cerrar la partida.
   */
  dispose() {
    this.textureManager.clear();
    this.activeCharacters.clear();
  }
}

window.CharacterManager = CharacterManager;

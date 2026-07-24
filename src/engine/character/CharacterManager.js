/**
 * CharacterManager - Punto único de entrada para el ciclo de vida de los personajes.
 */
class CharacterManager {
  constructor(loader, scene) {
    this.loader = loader;
    this.scene = scene;

    this.textureManager = new TextureManager();
    this.materialManager = new MaterialManager();
    this.textureStreaming = new TextureStreaming();
    this.factory = new CharacterFactory(this.loader, this.textureManager, this.materialManager);

    this.activeCharacters = new Map();
  }

  createCharacter(config) {
    console.log(`CharacterManager: Creando personaje '${config.name}' con rol '${config.role || 'player'}'`);
    const player = this.factory.createPlayer(config, this.scene);
    this.activeCharacters.set(player.id, player);
    return player;
  }

  getCharacter(id) {
    return this.activeCharacters.get(id);
  }

  update(dt, ballPos, cameraPos) {
    this.activeCharacters.forEach(character => {
      if (character.glbLoaded && character.lod && cameraPos) {
        const dist = character.mesh.position.distanceTo(cameraPos);
        character.lod.updateLOD(dist);
      }

      const group = character.getMesh();
      const prevX = group.userData.lastX !== undefined ? group.userData.lastX : group.position.x;
      const prevZ = group.userData.lastZ !== undefined ? group.userData.lastZ : group.position.z;
      const dx = group.position.x - prevX;
      const dz = group.position.z - prevZ;
      const velocity = new THREE.Vector3(dx / dt, 0, dz / dt);

      group.userData.lastX = group.position.x;
      group.userData.lastZ = group.position.z;

      character.update(dt, velocity, ballPos, cameraPos);
    });
  }

  dispose() {
    this.textureManager.clear();
    this.activeCharacters.clear();
  }
}

window.CharacterManager = CharacterManager;

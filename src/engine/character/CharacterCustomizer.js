/**
 * CharacterCustomizer - Aplica modificaciones estéticas y de escala física al personaje.
 */
class CharacterCustomizer {
  constructor(playerInstance, textureManager, materialManager, equipmentManager) {
    this.player = playerInstance;
    this.textureManager = textureManager;
    this.materialManager = materialManager;
    this.equipmentManager = equipmentManager;
  }

  customize(options) {
    const root = this.player.getMesh();

    if (options.height !== undefined) {
      root.scale.y = options.height / 1.80;
    }
    if (options.weight !== undefined) {
      const weightFactor = options.weight / 75.0;
      root.scale.x = weightFactor;
      root.scale.z = weightFactor;
    }

    if (options.uniform !== undefined && this.player.glbLoaded) {
      const u = options.uniform;
      if (u.shirtColor !== undefined || u.number !== undefined) {
        const shirtColor = u.shirtColor || '#00d4ff';
        const num = u.number !== undefined ? u.number : 7;
        const shirtTex = this.textureManager.generateShirtTexture(shirtColor, num, this.player.name);
        this.materialManager.applyToMesh(root, 'shirt', { map: shirtTex });
      }
      if (u.pantsColor !== undefined) {
        this.materialManager.applyToMesh(root, 'pants', { color: u.pantsColor });
      }
    }

    if (options.skinTone !== undefined && this.player.glbLoaded) {
      this.materialManager.applyToMesh(root, 'skin', { color: options.skinTone });
    }

    if (options.hairColor !== undefined && this.player.glbLoaded) {
      this.materialManager.applyToMesh(root, 'hair', { color: options.hairColor });
    }

    if (options.dominantHand !== undefined) {
      this.player.dominantHand = options.dominantHand;
      if (typeof this.player.attachPaddle === 'function') {
        this.player.attachPaddle();
      }
    }
  }
}

window.CharacterCustomizer = CharacterCustomizer;

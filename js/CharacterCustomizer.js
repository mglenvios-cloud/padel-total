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

  /**
   * Modifica parámetros del personaje.
   */
  customize(options) {
    const root = this.player.getMesh();

    // 1. Escala Física (Altura y Peso)
    if (options.height !== undefined) {
      // Escalado vertical suave
      root.scale.y = options.height / 1.80; // Altura base normalizada a 1.80m
    }
    if (options.weight !== undefined) {
      // Escalado de ancho (peso corporal)
      const weightFactor = options.weight / 75.0; // Peso base normalizado a 75kg
      root.scale.x = weightFactor;
      root.scale.z = weightFactor;
    }

    // 2. Personalización de Uniforme (Camiseta, Pantalón, Dorsal)
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

    // 3. Tono de Piel
    if (options.skinTone !== undefined && this.player.glbLoaded) {
      this.materialManager.applyToMesh(root, 'skin', { color: options.skinTone });
    }

    // 4. Color de Cabello
    if (options.hairColor !== undefined && this.player.glbLoaded) {
      this.materialManager.applyToMesh(root, 'hair', { color: options.hairColor });
    }

    // 5. Mano Dominante (Alinea e intercambia la pala)
    if (options.dominantHand !== undefined) {
      this.player.dominantHand = options.dominantHand;
      if (typeof this.player.attachPaddle === 'function') {
        this.player.attachPaddle();
      }
    }
  }
}

window.CharacterCustomizer = CharacterCustomizer;

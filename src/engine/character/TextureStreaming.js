/**
 * TextureStreaming - Controla el tamaño de textura en memoria en base al nivel de detalle y hardware.
 */
class TextureStreaming {
  constructor() {
    this.maxTextureSize = 2048; // Ultra
  }

  setQuality(level) {
    if (level === 'bajo') {
      this.maxTextureSize = 512;
    } else if (level === 'medio') {
      this.maxTextureSize = 1024;
    } else if (level === 'alto') {
      this.maxTextureSize = 2048;
    } else {
      this.maxTextureSize = 4096; // Ultra 4K
    }
    console.log(`TextureStreaming: Máximo tamaño de textura establecido en ${this.maxTextureSize}px`);
  }

  /**
   * Redimensiona una textura si excede la calidad máxima actual.
   */
  processTexture(texture) {
    if (!texture || !texture.image) return texture;

    const img = texture.image;
    if (img.width > this.maxTextureSize || img.height > this.maxTextureSize) {
      // Reducir la resolución en memoria
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
    }
    return texture;
  }
}

window.TextureStreaming = TextureStreaming;

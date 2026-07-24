/**
 * TextureManager - Genera y almacena texturas dinámicas (camisetas con dorsal, patrones, etc.).
 */
class TextureManager {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Genera una textura para la camiseta con color y dorsal del jugador.
   */
  generateShirtTexture(colorHex, number, name) {
    const key = `shirt_${colorHex}_${number}_${name}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base color
    ctx.fillStyle = colorHex;
    ctx.fillRect(0, 0, 512, 512);

    // Patrón decorativo (líneas sutiles de diseño deportivo)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    for (let i = 0; i < 512; i += 64) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 128, 512);
    }
    ctx.stroke();

    // Bordes cuello y mangas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, 512, 40);

    // Dorsal (Número en la espalda)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 160px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Sombra del número
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
    ctx.fillText(number.toString(), 256, 256);

    // Nombre en los hombros
    ctx.shadowColor = 'transparent';
    ctx.font = 'bold 36px Outfit, sans-serif';
    ctx.fillText(name.toUpperCase(), 256, 120);

    const texture = new THREE.CanvasTexture(canvas);
    this.cache.set(key, texture);
    return texture;
  }

  /**
   * Libera recursos de texturas en caché.
   */
  clear() {
    this.cache.forEach(texture => texture.dispose());
    this.cache.clear();
  }
}

window.TextureManager = TextureManager;

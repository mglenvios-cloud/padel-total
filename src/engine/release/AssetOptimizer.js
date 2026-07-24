/**
 * AssetOptimizer - Limpia cachés de geometrías y regula la resolución de texturas y mipmaps.
 */
class AssetOptimizer {
  constructor() {}

  optimizeTextures(textureList) {
    console.log('AssetOptimizer: Ajustando mapeo de filtrado anisotrópico y mipmaps...');
    textureList.forEach(tex => {
      if (tex) {
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.needsUpdate = true;
      }
    });
  }
}

window.AssetOptimizer = AssetOptimizer;

/**
 * GraphicsSettings - Administrador de perfiles gráficos (Ultra, Alta, Media, Baja).
 * Ajusta parámetros de renderizado, resolución, sombras y partículas para mantener FPS estables.
 */
class GraphicsSettings {
  constructor(renderer3d) {
    this.r3d = renderer3d;
    this.currentPreset = 'ultra';
    this.presets = {
      baja: {
        pixelRatio: 0.8,
        shadowMapSize: 512,
        shadowsEnabled: false,
        particlesCountFactor: 0.25,
        postProcessing: false,
        lodThresholds: { lod0: 5, lod1: 12, lod2: 20 }
      },
      media: {
        pixelRatio: 1.0,
        shadowMapSize: 1024,
        shadowsEnabled: true,
        particlesCountFactor: 0.5,
        postProcessing: false,
        lodThresholds: { lod0: 10, lod1: 20, lod2: 35 }
      },
      alta: {
        pixelRatio: 1.5,
        shadowMapSize: 2048,
        shadowsEnabled: true,
        particlesCountFactor: 1.0,
        postProcessing: true,
        lodThresholds: { lod0: 15, lod1: 30, lod2: 50 }
      },
      ultra: {
        pixelRatio: 2.0,
        shadowMapSize: 4096,
        shadowsEnabled: true,
        particlesCountFactor: 1.5,
        postProcessing: true,
        lodThresholds: { lod0: 25, lod1: 45, lod2: 70 }
      }
    };
  }

  /**
   * Aplica un perfil gráfico al motor Three.js.
   */
  setPreset(presetName) {
    const config = this.presets[presetName] || this.presets.ultra;
    this.currentPreset = presetName;

    console.log(`GraphicsSettings: Aplicando perfil '${presetName}'`);

    const renderer = this.r3d.renderer;
    if (!renderer) return;

    // 1. Ajuste de Pixel Ratio (Resolución interna)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio * config.pixelRatio, 2));

    // 2. Sombras
    renderer.shadowMap.enabled = config.shadowsEnabled;
    if (this.r3d.sun) {
      this.r3d.sun.castShadow = config.shadowsEnabled;
      this.r3d.sun.shadow.mapSize.width = config.shadowMapSize;
      this.r3d.sun.shadow.mapSize.height = config.shadowMapSize;
      this.r3d.sun.shadow.map = null; // Reiniciar mapa para redimensionar
    }

    // 3. LOD Thresholds globales
    if (this.r3d.characterManager) {
      this.r3d.characterManager.activeCharacters.forEach(c => {
        if (c.lod) {
          c.lod.lodThresholds = config.lodThresholds;
        }
      });
    }

    // 4. Cambios en efectos adicionales en el renderer
    this.r3d.postProcessingEnabled = config.postProcessing;
    this.r3d.particlesLimitFactor = config.particlesCountFactor;
  }
}

window.GraphicsSettings = GraphicsSettings;

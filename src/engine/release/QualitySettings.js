/**
 * QualitySettings (Release) - Configura los parámetros gráficos según el nivel de calidad.
 */
class QualitySettings {
  constructor() {
    this.presets = {
      low: { shadowMapSize: 512, particlesCount: 100, crowdDensity: 0.25 },
      medium: { shadowMapSize: 1024, particlesCount: 300, crowdDensity: 0.5 },
      high: { shadowMapSize: 2048, particlesCount: 600, crowdDensity: 0.8 },
      ultra: { shadowMapSize: 2048, particlesCount: 1000, crowdDensity: 1.0 }
    };
  }

  applyPreset(renderer3d, presetName) {
    const config = this.presets[presetName] || this.presets.medium;
    console.log(`Quality Settings: Aplicando perfil gráfico '${presetName}'...`);
    
    if (renderer3d && renderer3d.sun && renderer3d.sun.shadow) {
      renderer3d.sun.shadow.mapSize.set(config.shadowMapSize, config.shadowMapSize);
      if (renderer3d.sun.shadow.map) {
        renderer3d.sun.shadow.map.dispose();
        renderer3d.sun.shadow.map = null; // Forzar regeneración
      }
    }
  }
}

window.QualitySettings = QualitySettings;

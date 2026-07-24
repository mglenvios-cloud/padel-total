/**
 * PerformanceManager - Monitoriza FPS en tiempo real y realiza ajustes dinámicos de calidad.
 */
class PerformanceManager {
  constructor(qualitySettings, renderer3d) {
    this.quality = qualitySettings;
    this.renderer = renderer3d;
    this.fpsHistory = [];
  }

  trackFrame(dt) {
    const fps = Math.round(1.0 / dt);
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > 100) this.fpsHistory.shift();

    // Si los FPS bajan constantemente de 30, forzar baja de calidad gráfica
    const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    if (this.fpsHistory.length >= 100 && avgFps < 30) {
      console.warn('Rendimiento: FPS por debajo del umbral mínimo. Reajustando calidad...');
      this.quality.applyPreset(this.renderer, 'low');
      this.fpsHistory = []; // Resetear historial para medir de nuevo
    }
  }
}

window.PerformanceManager = PerformanceManager;

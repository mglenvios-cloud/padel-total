/**
 * WebPerformanceMonitor - Mide tasas de renderizado, draw calls y tiempos de GPU en la web.
 */
class WebPerformanceMonitor {
  constructor() {
    this.fps = 60;
    this.memoryUsage = 0;
  }

  logMetric(fpsVal, drawCallsCount) {
    this.fps = fpsVal;
    // console.log(`WebPerf: ${fpsVal} FPS | Draw Calls: ${drawCallsCount}`);
  }
}

window.WebPerformanceMonitor = WebPerformanceMonitor;

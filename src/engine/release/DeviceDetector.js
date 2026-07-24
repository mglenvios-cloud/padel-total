/**
 * DeviceDetector - Detecta hardware (Móvil, Tablet, PC) y adapta resoluciones y FPS límite.
 */
class DeviceDetector {
  constructor() {
    this.userAgent = navigator.userAgent || navigator.vendor || window.opera;
  }

  detectDevice() {
    const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(this.userAgent);
    const isTablet = /ipad|android/i.test(this.userAgent) && !/mobile/i.test(this.userAgent);

    if (isTablet) return 'Tablet';
    if (isMobile) return 'Mobile';
    return 'PC';
  }

  getFpsCap() {
    const dev = this.detectDevice();
    return dev === 'PC' ? 120 : 60; // Cap a 120 FPS en PC, 60 FPS en móviles/tablets
  }
}

window.DeviceDetector = DeviceDetector;

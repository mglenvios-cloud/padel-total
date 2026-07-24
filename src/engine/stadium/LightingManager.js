/**
 * LightingManager - Controla la iluminación de la pista (focos, ambiental, sombras).
 */
class LightingManager {
  constructor(scene) {
    this.scene = scene;
    this.ambientLight = null;
    this.sun = null;
  }

  setup() {
    // 1. Luz Ambiental
    this.ambientLight = new THREE.AmbientLight(0x0e1320, 1.4);
    this.scene.add(this.ambientLight);

    // 2. Luz de Foco / Sol Direccional con sombras
    this.sun = new THREE.DirectionalLight(0xfff5ea, 1.6);
    this.sun.position.set(6, 18, 5);
    this.sun.castShadow = true;
    
    // Parámetros de la cámara de sombra
    this.sun.shadow.camera.near = 1.0;
    this.sun.shadow.camera.far = 40.0;
    this.sun.shadow.camera.left = -11.0;
    this.sun.shadow.camera.right = 11.0;
    this.sun.shadow.camera.top = 15.0;
    this.sun.shadow.camera.bottom = -15.0;
    this.sun.shadow.bias = -0.0003;
    
    this.sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(this.sun);
  }
}

window.LightingManager = LightingManager;

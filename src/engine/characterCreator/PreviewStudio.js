/**
 * PreviewStudio - Escenario 3D de iluminación profesional y planos cercanos para personalizar.
 */
class PreviewStudio {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.lights = [];
  }

  setupStudio() {
    console.log('PreviewStudio: Activando modo personalizador 3D...');
    
    // Luz clave (Key Light)
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(2, 2, 4);
    this.scene.add(key);
    this.lights.push(key);

    // Luz de relleno (Fill Light)
    const fill = new THREE.DirectionalLight(0x88ccff, 0.6);
    fill.position.set(-2, 1, 2);
    this.scene.add(fill);
    this.lights.push(fill);

    // Mover cámara para primer plano del busto/rostro
    this.camera.position.set(0, 1.45, 1.8);
    this.camera.lookAt(0, 1.45, 0);
  }

  tearDownStudio() {
    this.lights.forEach(light => this.scene.remove(light));
    this.lights = [];
  }
}

window.PreviewStudio = PreviewStudio;

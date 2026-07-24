/**
 * WeatherManager - Gestiona el clima y condiciones ambientales.
 */
class WeatherManager {
  constructor(scene) {
    this.scene = scene;
    this.rainParticles = null;
    this.activeWeather = 'despejado';
  }

  setWeather(type) {
    this.activeWeather = type;
    console.log(`WeatherManager: Clima cambiado a '${type}'`);

    // Limpiar lluvia previa si existe
    if (this.rainParticles) {
      this.scene.remove(this.rainParticles);
      this.rainParticles = null;
    }

    if (type === 'lluvia') {
      this._buildRain();
    }
  }

  _buildRain() {
    const rainCount = 1000;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = Math.random() * 15;
      positions[i + 2] = (Math.random() - 0.5) * 30;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 0.08,
      transparent: true,
      opacity: 0.55
    });

    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.rainParticles);
  }

  update(dt) {
    if (this.rainParticles) {
      const pos = this.rainParticles.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] -= dt * 9.8; // Caída de gravedad
        if (pos[i] < 0) {
          pos[i] = 15; // Reiniciar arriba
        }
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }
  }
}

window.WeatherManager = WeatherManager;

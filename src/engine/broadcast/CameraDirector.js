/**
 * CameraDirector - Director de cámaras automatizado por IA deportiva.
 */
class CameraDirector {
  constructor(camera) {
    this.camera = camera;
    this.activeMode = 'broadcast';
    this.cams = new CinematicCamera();
    this.timer = 0;
    // Look target persistente para interpolación correcta
    this._lookTarget = new THREE.Vector3(0, 0, 0);
  }

  update(dt, ballPos, players, playState, frame) {
    this.timer += dt;

    const human = players ? players.find(p => p.isHuman) : null;
    const humanPos = human && human.mesh ? human.mesh.position : new THREE.Vector3(0, 0, 7);

    // Selección IA de la mejor toma
    if (playState === 'serve' && this.activeMode !== 'follow' && Math.random() < 0.005) {
      this.activeMode = 'follow';
    } else if (playState === 'rally' && this.activeMode === 'follow') {
      this.activeMode = 'broadcast';
    }

    const { targetPos, lookPos } = this.cams.getPreset(this.activeMode, ballPos, humanPos, this.timer, frame);

    // Interpolación suave de posición y punto de mira
    this.camera.position.lerp(targetPos, dt * 2.0);
    this._lookTarget.lerp(lookPos, dt * 3.0);
    this.camera.lookAt(this._lookTarget);
  }
}

window.CameraDirector = CameraDirector;

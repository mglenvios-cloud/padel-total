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

  setMode(mode) {
    this.activeMode = mode;
    console.log(`🎥 CameraDirector: Modo de cámara cambiado a -> ${mode.toUpperCase()}`);
  }

  update(dt, ballPos, players, playState, frame) {
    this.timer += dt;

    const human = players ? players.find(p => p.isHuman) : null;
    const humanPos = human && human.mesh ? human.mesh.position : new THREE.Vector3(0, 0, 7);

    const { targetPos, lookPos } = this.cams.getPreset(this.activeMode, ballPos, humanPos, this.timer, frame);

    // Interpolación veloz y reactiva para máximo dinamismo
    const lerpSpeed = this.activeMode === 'low' ? dt * 4.5 : dt * 3.2;
    this.camera.position.lerp(targetPos, lerpSpeed);
    this._lookTarget.lerp(lookPos, dt * 5.0);
    this.camera.lookAt(this._lookTarget);
  }
}

window.CameraDirector = CameraDirector;

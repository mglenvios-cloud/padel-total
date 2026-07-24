/**
 * SpatialAudio - Motor de audio espacial 3D con HRTF (Head-Related Transfer Function).
 */
class SpatialAudio {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.panner = null;
    this.setupPanner();
  }

  setupPanner() {
    if (!this.ctx) return;

    this.panner = this.ctx.createPanner();
    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = 'inverse';
    this.panner.refDistance = 1.0;
    this.panner.maxDistance = 1000.0;
    this.panner.rollOffFactor = 1.0;
    this.panner.coneInnerAngle = 360.0;
    this.panner.coneOuterAngle = 360.0;
  }

  /**
   * Actualiza la posición 3D de la fuente de sonido.
   */
  updatePosition(x, y, z) {
    if (!this.panner) return;

    if (this.panner.positionX) {
      // Navegadores modernos (Web Audio API nueva)
      this.panner.positionX.setValueAtTime(x, this.ctx.currentTime);
      this.panner.positionY.setValueAtTime(y, this.ctx.currentTime);
      this.panner.positionZ.setValueAtTime(z, this.ctx.currentTime);
    } else {
      // Compatibilidad navegadores antiguos
      this.panner.setPosition(x, y, z);
    }
  }

  /**
   * Actualiza la posición del oyente virtual (generalmente en la cámara).
   */
  updateListener(x, y, z, orientX = 0, orientY = 0, orientZ = -1, upX = 0, upY = 1, upZ = 0) {
    if (!this.ctx) return;

    const listener = this.ctx.listener;
    if (listener.positionX) {
      listener.positionX.setValueAtTime(x, this.ctx.currentTime);
      listener.positionY.setValueAtTime(y, this.ctx.currentTime);
      listener.positionZ.setValueAtTime(z, this.ctx.currentTime);
      listener.forwardX.setValueAtTime(orientX, this.ctx.currentTime);
      listener.forwardY.setValueAtTime(orientY, this.ctx.currentTime);
      listener.forwardZ.setValueAtTime(orientZ, this.ctx.currentTime);
      listener.upX.setValueAtTime(upX, this.ctx.currentTime);
      listener.upY.setValueAtTime(upY, this.ctx.currentTime);
      listener.upZ.setValueAtTime(upZ, this.ctx.currentTime);
    } else {
      listener.setPosition(x, y, z);
      listener.setOrientation(orientX, orientY, orientZ, upX, upY, upZ);
    }
  }
}

window.SpatialAudio = SpatialAudio;

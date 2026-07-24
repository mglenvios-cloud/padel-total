/**
 * ReplayManager - Grabador de jugadas y buffer circular para repeticiones instantáneas.
 */
class ReplayManager {
  constructor() {
    this.buffer = [];
    this.maxFrames = 300; // Almacenar ~5 segundos a 60fps
    this.isPlaying = false;
    this.replayFrameIdx = 0;
  }

  recordFrame(ballPos, players) {
    if (this.isPlaying) return;

    const frameData = {
      ballPos: ballPos ? ballPos.clone() : new THREE.Vector3(),
      players: (players || []).map(p => ({
        id: p.id,
        pos: p.mesh ? p.mesh.position.clone() : new THREE.Vector3(),
        animState: p.mesh ? p.mesh.userData.animState : 'idle'
      }))
    };

    this.buffer.push(frameData);
    if (this.buffer.length > this.maxFrames) {
      this.buffer.shift(); // Descartar el más antiguo
    }
  }

  startReplay() {
    this.isPlaying = true;
    this.replayFrameIdx = 0;
    console.log('ReplayManager: Iniciando repetición instantánea...');
  }

  stopReplay() {
    this.isPlaying = false;
    this.buffer = [];
  }

  /**
   * Lee e inyecta la pose guardada en las entidades visuales para reproducir la repetición.
   */
  playNextFrame(ballMesh, players) {
    if (!this.isPlaying || this.buffer.length === 0) return false;

    const frame = this.buffer[this.replayFrameIdx];
    if (!frame) {
      this.stopReplay();
      return false;
    }

    // Inyectar pelota
    if (ballMesh) ballMesh.position.copy(frame.ballPos);

    // Inyectar jugadores
    frame.players.forEach(fp => {
      const p = players.find(x => x.id === fp.id);
      if (p && p.mesh) {
        p.mesh.position.copy(fp.pos);
        p.mesh.userData.animState = fp.animState;
      }
    });

    this.replayFrameIdx++;
    if (this.replayFrameIdx >= this.buffer.length) {
      this.stopReplay();
      return false; // Repetición finalizada
    }

    return true;
  }
}

window.ReplayManager = ReplayManager;

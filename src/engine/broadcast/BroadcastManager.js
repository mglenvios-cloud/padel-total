/**
 * BroadcastManager - Coordinador central del sistema de transmisión y repetición.
 */
class BroadcastManager {
  constructor(camera) {
    this.director = new CameraDirector(camera);
    this.replay = new ReplayManager();
    this.highlight = new HighlightManager();
    this.graphics = new TVGraphics();
    this.commentary = new CommentaryManager();
  }

  update(dt, ballPos, players, playState, ballSpeed, frame) {
    // 1. Grabar frames para repeticiones instantáneas si no se está ejecutando un replay
    if (!this.replay.isPlaying) {
      this.replay.recordFrame(ballPos, players);
      this.director.update(dt, ballPos, players, playState, frame);
    }

    // 2. Si hay repetición activa, reproducirla
    const ballMesh = this.director.camera.parent 
      ? this.director.camera.parent.getObjectByName('BallMesh') 
      : null;
    this.replay.playNextFrame(ballMesh, players);

    // 3. Actualizar paneles del HUD de TV
    const human = players ? players.find(p => p.isHuman) : null;
    const name = human ? human.name : 'Jugador';
    this.graphics.update(ballSpeed || 0, name);
  }

  narrate(shotType, playerName) {
    this.commentary.narrateHit(shotType, playerName);
  }

  triggerReplay() {
    this.replay.startReplay();
  }
}

window.BroadcastManager = BroadcastManager;

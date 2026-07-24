/**
 * AudioManager - Orquestador central del sistema de audio espacial 3D y ambiente reactivo.
 */
class AudioManager {
  constructor() {
    // 1. Inicializar contexto de audio en el primer clic de interacción
    this.ctx = null;
    this.spatial = null;
    this.crowd = null;
    this.impact = null;
    this.commentator = null;
    this.music = null;
    this.mixer = null;
    this.pool = null;

    this._setupUserGesture();
  }

  _setupUserGesture() {
    const init = () => {
      if (this.ctx) return;
      
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        console.log('AudioManager: Inicializando Web Audio Context...');
        this.ctx = new AudioContextClass();
        
        this.spatial = new SpatialAudio(this.ctx);
        this.crowd = new CrowdAudio(this.ctx);
        this.impact = new ImpactAudio(this.ctx);
        this.commentator = new CommentatorAI();
        this.music = new MusicManager(this.ctx);
        this.mixer = new DynamicMixer(this.ctx);
        this.pool = new AudioPool(this.ctx);

        this.music.startAmbientMusic();
      }
      
      window.removeEventListener('click', init);
      window.removeEventListener('keydown', init);
    };

    window.addEventListener('click', init);
    window.addEventListener('keydown', init);
  }

  playHit(power, type) {
    if (this.impact) {
      this.impact.playHit(power, type);
    }
  }

  playStep(x, z) {
    if (!this.ctx || this.ctx.state === 'suspended') return;

    // Sintetizar ruido sutil de paso (filtro de paso alto)
    const bufferSize = this.ctx.sampleRate * 0.05; // 50ms de paso
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // Ruido blanco
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000; // Paso crujiente

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noiseNode.start();
  }

  playBounce(volume = 0.5) {
    if (!this.ctx || this.ctx.state === 'suspended') return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Ruido sordo de bote
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(volume * 0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playWall() {
    this.playBounce(0.3);
  }

  playNet() {
    this.playBounce(0.2);
  }

  playBreath() {}

  cheer(intensity = 0.5) {
    if (this.crowd) {
      this.crowd.cheer(intensity);
    }
  }

  narrate(scoreTeam0, scoreTeam1) {
    if (this.commentator) {
      this.commentator.narratePoints(scoreTeam0, scoreTeam1);
    }
  }

  updateListener(cameraPos, cameraRotation) {
    if (this.spatial && cameraPos) {
      this.spatial.updateListener(cameraPos.x, cameraPos.y, cameraPos.z);
    }
  }
}

window.AudioManager = AudioManager;

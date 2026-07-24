/**
 * DynamicMixer - Mezclador de audio profesional para nivelar canales de sonido.
 */
class DynamicMixer {
  constructor(audioContext) {
    this.ctx = audioContext;
    this.volumes = {
      master: 1.0,
      crowd: 0.8,
      sfx: 0.9,
      music: 0.5,
      voice: 1.0
    };
  }

  setVolume(channel, value) {
    if (this.volumes[channel] !== undefined) {
      this.volumes[channel] = Math.max(0, Math.min(1.0, value));
      console.log(`DynamicMixer: Volumen de canal '${channel}' fijado en ${value}`);
    }
  }

  getMultiplier(channel) {
    return (this.volumes[channel] ?? 1.0) * this.volumes.master;
  }
}

window.DynamicMixer = DynamicMixer;

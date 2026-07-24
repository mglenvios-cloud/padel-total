/**
 * AnimationLibrary - Biblioteca de referencias y mapeos de animaciones de Pádel.
 */
const AnimationLibrary = {
  locomotion: {
    idle: 'Idle',
    ready: 'Ready',
    splitStep: 'Split Step',
    walk: 'Walk',
    jog: 'Jog',
    sprint: 'Sprint',
    sideShuffle: 'Side Shuffle',
    crossStep: 'Cross Step',
    backPedal: 'Back Pedal',
    recovery: 'Recovery Steps'
  },
  shots: {
    forehand: 'Forehand',
    backhand: 'Backhand',
    volleyForehand: 'Volley derecha',
    volleyBackhand: 'Volley revés',
    smash: 'Smash',
    jumpSmash: 'Jump Smash',
    bandeja: 'Bandeja',
    vibora: 'Víbora',
    lob: 'Globo',
    wallBounce: 'Salida de pared',
    lowDefense: 'Defensa baja'
  },

  /**
   * Retorna el nombre mapeado correspondiente a la acción solicitada.
   */
  getClipName(type, name) {
    if (this.locomotion[name]) return this.locomotion[name];
    if (this.shots[name]) return this.shots[name];
    return name;
  }
};

window.AnimationLibrary = AnimationLibrary;

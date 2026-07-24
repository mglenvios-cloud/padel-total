/**
 * RivalryManager - Mide la tensión e historial frente a oponentes históricos (clásicos).
 */
class RivalryManager {
  constructor() {
    this.rivalsRecord = {
      'Ramos': { played: 5, wins: 3, losses: 2 }
    };
  }

  getRivalryTension(rivalName) {
    const record = this.rivalsRecord[rivalName];
    if (record && record.played > 3) {
      return '¡Un clásico absoluto de las pistas de pádel!';
    }
    return 'Primera vez que se miden en el circuito.';
  }
}

window.RivalryManager = RivalryManager;

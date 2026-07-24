/**
 * MatchmakingManager - Empareja jugadores en salas competitivas según su rango ELO.
 */
class MatchmakingManager {
  constructor() {
    this.inQueue = false;
    this.eloRangeDelta = 50; // Rango inicial de tolerancia ELO
  }

  startQueue(playerElo, region = 'EU-WEST') {
    this.inQueue = true;
    this.eloRangeDelta = 50;
    console.log(`Matchmaking: Buscando oponente en la región ${region} (ELO base: ${playerElo})...`);
    this._pollMatchmaking(playerElo);
  }

  _pollMatchmaking(playerElo) {
    if (!this.inQueue) return;

    // Ampliar tolerancia ELO cada segundo para evitar esperas eternas
    setTimeout(() => {
      if (!this.inQueue) return;

      this.eloRangeDelta += 30;
      console.log(`Matchmaking: Ampliando rango a +/- ${this.eloRangeDelta} ELO`);
      
      // Simular encuentro exitoso de partida
      if (this.eloRangeDelta >= 140) {
        this.inQueue = false;
        console.log(`Matchmaking: ¡Rival encontrado! ELO del rival: ${playerElo + Math.floor((Math.random() - 0.5) * 100)}`);
      } else {
        this._pollMatchmaking(playerElo);
      }
    }, 1000);
  }

  cancelQueue() {
    this.inQueue = false;
    console.log('Matchmaking: Cola cancelada.');
  }
}

window.MatchmakingManager = MatchmakingManager;

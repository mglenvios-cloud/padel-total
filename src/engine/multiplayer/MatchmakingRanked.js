/**
 * MatchmakingRanked - Cola competitiva clasificatoria (Ranked) por divisiones y ELO.
 */
class MatchmakingRanked {
  constructor() {
    this.inQueue = false;
  }

  find2v2Match(playerElo, region = 'US-EAST') {
    this.inQueue = true;
    console.log(`Ranked Matchmaking: Buscando lobby 2v2 en ${region} para ELO ${playerElo}...`);
    
    // Simular emparejamiento 2v2 exitoso tras 2 segundos
    setTimeout(() => {
      if (this.inQueue) {
        this.inQueue = false;
        console.log('Ranked Matchmaking: ¡Lobby 2v2 completado! Inicializando sala...');
      }
    }, 2000);
  }
}

window.MatchmakingRanked = MatchmakingRanked;

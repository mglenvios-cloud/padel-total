/**
 * PlayerTransferManager - Mercado de fichajes de jugadores y negociaciones de contratos.
 */
class PlayerTransferManager {
  constructor() {
    this.marketList = [
      { name: 'Gómez', age: 26, rating: 65, valuation: 1200, salary: 150 },
      { name: 'Silva', age: 22, rating: 72, valuation: 2500, salary: 280 }
    ];
  }

  proposeOffer(player, priceOffer) {
    if (priceOffer >= player.valuation * 0.9) {
      console.log(`Fichajes: Oferta aceptada por ${player.name} por ${priceOffer} Monedas.`);
      return true;
    }
    console.log(`Fichajes: Oferta rechazada por ${player.name}. Piden al menos ${Math.round(player.valuation * 0.9)}`);
    return false;
  }
}

window.PlayerTransferManager = PlayerTransferManager;

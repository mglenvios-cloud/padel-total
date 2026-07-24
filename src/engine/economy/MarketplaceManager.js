/**
 * MarketplaceManager - Tienda del juego para comprar palas, calzado y uniformes.
 */
class MarketplaceManager {
  constructor() {
    this.catalog = {
      paddles: [
        { id: 'pad_pro_01', name: 'Bullpadel Vertex', cost: 500, stats: { power: 8, control: 6 } },
        { id: 'pad_pro_02', name: 'Adidas Metalbone', cost: 750, stats: { power: 9, control: 5 } }
      ],
      shoes: [
        { id: 'shoe_01', name: 'Asics Gel-Padel', cost: 300, stats: { speed: 7, grip: 8 } }
      ]
    };
  }

  getItems(category) {
    return this.catalog[category] || [];
  }
}

window.MarketplaceManager = MarketplaceManager;

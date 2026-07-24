/**
 * MarketplaceOnline - Tienda global online de cosméticos exclusivos para avatares y estadios.
 */
class MarketplaceOnline {
  constructor() {
    this.premiumItems = [
      { id: 'skin_gold_01', name: 'Ropa de Campeón Dorado', cost: 1200 },
      { id: 'court_neon_01', name: 'Pista de Neón eSports', cost: 3000 }
    ];
  }

  buyPremiumItem(itemId, currencyManager) {
    const item = this.premiumItems.find(i => i.id === itemId);
    if (item && currencyManager.spendCoins(item.cost)) {
      console.log(`Tienda Online: Adquirido cosmético premium '${item.name}'`);
      return true;
    }
    return false;
  }
}

window.MarketplaceOnline = MarketplaceOnline;

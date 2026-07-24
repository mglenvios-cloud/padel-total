/**
 * EconomyManager - Administrador central de la economía, progresión y guardado persistente.
 */
class EconomyManager {
  constructor() {
    this.currency = new CurrencyManager();
    this.marketplace = new MarketplaceManager();
    this.inventory = new InventoryManager();
    this.equipment = new EquipmentManager();
    this.customizer = new CustomizationManager();
    this.sponsors = new SponsorManager();
    this.contracts = new ContractManager();
    this.rewards = new RewardManager(this.currency);
    this.pass = new SeasonPassManager();

    this.loadState();
  }

  loadState() {
    try {
      const data = localStorage.getItem('padel_pro_economy_state');
      if (data) {
        const state = JSON.parse(data);
        this.currency.coins = state.coins ?? 1000;
        this.currency.credits = state.credits ?? 150;
        this.inventory.ownedItems = state.ownedItems ?? ['pad_base', 'shoe_base'];
        this.equipment.slots = state.equippedSlots ?? { paddle: 'pad_base', shoes: 'shoe_base', shirt: 'shirt_base' };
        console.log('EconomyManager: Estado económico cargado desde almacenamiento local persistente.');
      }
    } catch (e) {
      console.warn('EconomyManager: Error al leer datos locales.', e);
    }
  }

  saveState() {
    try {
      const state = {
        coins: this.currency.coins,
        credits: this.currency.credits,
        ownedItems: this.inventory.ownedItems,
        equippedSlots: this.equipment.slots
      };
      localStorage.setItem('padel_pro_economy_state', JSON.stringify(state));
      console.log('EconomyManager: Estado económico guardado con éxito.');
    } catch (e) {
      console.warn('EconomyManager: Error al serializar datos locales.', e);
    }
  }
}

window.EconomyManager = EconomyManager;

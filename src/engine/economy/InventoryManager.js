/**
 * InventoryManager - Gestiona el inventario de equipamiento y cosméticos adquiridos.
 */
class InventoryManager {
  constructor() {
    this.ownedItems = ['pad_base', 'shoe_base'];
  }

  addItem(itemId) {
    if (!this.ownedItems.includes(itemId)) {
      this.ownedItems.push(itemId);
      console.log(`Inventory: Item '${itemId}' añadido al armario.`);
    }
  }

  hasItem(itemId) {
    return this.ownedItems.includes(itemId);
  }
}

window.InventoryManager = InventoryManager;

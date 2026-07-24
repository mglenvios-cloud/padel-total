/**
 * EquipmentManager (Economy) - Controla el equipamiento activo y sus estadísticas asociadas.
 */
class EquipmentManager {
  constructor() {
    this.slots = {
      paddle: 'pad_base',
      shoes: 'shoe_base',
      shirt: 'shirt_base'
    };
  }

  equipItem(slot, itemId) {
    if (this.slots[slot] !== undefined) {
      this.slots[slot] = itemId;
      console.log(`Equipment (Economy): Item '${itemId}' equipado en ranura '${slot}'`);
    }
  }
}

window.EquipmentManager = EquipmentManager;

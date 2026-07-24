/**
 * EquipmentManager - Encargado de acoplar y cambiar palas, calzado y accesorios.
 */
class EquipmentManager {
  constructor(rig) {
    this.rig = rig;
    this.equippedItems = new Map();
  }

  /**
   * Equipa un accesorio o pala en un hueso articulado determinado del Rig.
   */
  equipItem(slot, itemMesh, boneName, positionOffset, rotationOffset) {
    // Desequipar lo que esté en ese slot anteriormente
    this.unequipItem(slot);

    if (this.rig) {
      const success = this.rig.attachObject(boneName, itemMesh, positionOffset, rotationOffset);
      if (success) {
        this.equippedItems.set(slot, { mesh: itemMesh, bone: boneName });
      }
    }
  }

  /**
   * Desequipa el objeto del slot indicado.
   */
  unequipItem(slot) {
    const item = this.equippedItems.get(slot);
    if (item && this.rig) {
      this.rig.detachObject(item.bone);
      this.equippedItems.delete(slot);
    }
  }
}

window.EquipmentManager = EquipmentManager;

/**
 * EquipmentManager - Encargado de acoplar y cambiar palas, calzado y accesorios.
 */
class EquipmentManager {
  constructor(rig) {
    this.rig = rig;
    this.equippedItems = new Map();
  }

  equipItem(slot, itemMesh, boneName, positionOffset, rotationOffset) {
    this.unequipItem(slot);

    if (this.rig) {
      const success = this.rig.attachObject(boneName, itemMesh, positionOffset, rotationOffset);
      if (success) {
        this.equippedItems.set(slot, { mesh: itemMesh, bone: boneName });
      }
    }
  }

  unequipItem(slot) {
    const item = this.equippedItems.get(slot);
    if (item && this.rig) {
      this.rig.detachObject(item.bone);
      this.equippedItems.delete(slot);
    }
  }
}

window.EquipmentManager = EquipmentManager;

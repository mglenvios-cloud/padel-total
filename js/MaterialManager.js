/**
 * MaterialManager - Administra los materiales de las mallas (Mesh/SkinnedMesh) de los personajes.
 */
class MaterialManager {
  constructor() {
    this.materials = new Map();
  }

  /**
   * Aplica un material o modifica propiedades existentes de forma óptima sin duplicar mallas.
   */
  applyToMesh(mesh, partName, materialOptions) {
    mesh.traverse(node => {
      if (node.isMesh || node.isSkinnedMesh) {
        const name = node.name.toLowerCase();
        if (name.includes(partName.toLowerCase())) {
          
          // Crear o clonar material para evitar alterar otros personajes independientes si comparten el mismo material de base
          if (node.material) {
            if (!this.materials.has(node.material.uuid)) {
              node.material = node.material.clone();
              this.materials.set(node.material.uuid, node.material);
            }

            const mat = node.material;
            if (materialOptions.color !== undefined) {
              mat.color.set(materialOptions.color);
            }
            if (materialOptions.map !== undefined) {
              mat.map = materialOptions.map;
            }
            if (materialOptions.roughness !== undefined) {
              mat.roughness = materialOptions.roughness;
            }
            if (materialOptions.metalness !== undefined) {
              mat.metalness = materialOptions.metalness;
            }
            mat.needsUpdate = true;
          }
        }
      }
    });
  }
}

window.MaterialManager = MaterialManager;

/**
 * LODManager - Administra los niveles de detalle (LOD0-LOD3) dinámicamente.
 */
class LODManager {
  constructor(mesh, animController) {
    this.mesh = mesh;
    this.anim = animController;
    this.lodLevel = 0;
    this.lodThresholds = { lod0: 15, lod1: 30, lod2: 50 };
  }

  updateLOD(distanceToCamera) {
    let newLevel = 0;
    if (distanceToCamera > this.lodThresholds.lod2) {
      newLevel = 3; // LOD3
    } else if (distanceToCamera > this.lodThresholds.lod1) {
      newLevel = 2; // LOD2
    } else if (distanceToCamera > this.lodThresholds.lod0) {
      newLevel = 1; // LOD1
    } else {
      newLevel = 0; // LOD0
    }

    if (newLevel !== this.lodLevel) {
      this.lodLevel = newLevel;
      this.applyLODSettings();
    }
  }

  applyLODSettings() {
    this.mesh.traverse(node => {
      if (node.isMesh || node.isSkinnedMesh) {
        if (this.lodLevel >= 2) {
          node.castShadow = false;
          node.receiveShadow = false;
        } else {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      }
    });

    if (this.anim) {
      this.anim.lodLevel = this.lodLevel;
    }
  }
}

window.LODManager = LODManager;

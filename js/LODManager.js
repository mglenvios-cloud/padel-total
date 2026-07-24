/**
 * LODManager - Administra los niveles de detalle (LOD0-LOD3) dinámicamente.
 */
class LODManager {
  constructor(mesh, animController) {
    this.mesh = mesh;
    this.anim = animController;
    this.lodLevel = 0; // 0: LOD0, 1: LOD1, 2: LOD2, 3: LOD3
  }

  /**
   * Actualiza el LOD basado en la distancia del jugador a la cámara.
   */
  updateLOD(distanceToCamera) {
    let newLevel = 0;
    if (distanceToCamera > 45) {
      newLevel = 3; // LOD3: Sin sombras, sin animación, mínima actualización
    } else if (distanceToCamera > 30) {
      newLevel = 2; // LOD2: Sin sombras suaves, animación a 15 FPS
    } else if (distanceToCamera > 15) {
      newLevel = 1; // LOD1: Sombras activas, animación a 30 FPS
    } else {
      newLevel = 0; // LOD0: Detalle completo, sombras de alta calidad, 60/120 FPS
    }

    if (newLevel !== this.lodLevel) {
      this.lodLevel = newLevel;
      this.applyLODSettings();
    }
  }

  /**
   * Aplica los parámetros gráficos correspondientes al nivel de LOD actual.
   */
  applyLODSettings() {
    // 1. Sombras dinámicas según LOD
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

    // 2. Comunicar nivel al controlador de animaciones
    if (this.anim) {
      this.anim.lodLevel = this.lodLevel;
    }
  }
}

window.LODManager = LODManager;

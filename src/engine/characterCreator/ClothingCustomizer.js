/**
 * ClothingCustomizer - Configura el color, patrocinadores y dorsales del uniforme del jugador.
 */
class ClothingCustomizer {
  constructor() {
    this.uniformColor = 0xffffff;
  }

  applyUniformColor(shirtMesh, colorHex) {
    if (!shirtMesh || !shirtMesh.material) return;

    this.uniformColor = colorHex;
    shirtMesh.material.color.setHex(colorHex);
    console.log(`ClothingCustomizer: Color de camiseta actualizado a ${colorHex.toString(16)}`);
  }
}

window.ClothingCustomizer = ClothingCustomizer;

/**
 * ScreenManager - Administra los marcadores LED y pantallas gigantes.
 */
class ScreenManager {
  constructor(scene) {
    this.scene = scene;
    this.screenMesh = null;
  }

  buildGiantScreen() {
    const screenGeo = new THREE.BoxGeometry(6, 3, 0.1);
    
    // Generar textura canvas inicial
    const canvasTex = this._generateScoreboardTexture('00 - 00', 'TU EQUIPO vs RIVALES');
    this.screenMat = new THREE.MeshStandardMaterial({
      map: canvasTex,
      emissiveMap: canvasTex,
      emissive: 0xffffff,
      emissiveIntensity: 0.85
    });

    this.screenMesh = new THREE.Mesh(screenGeo, this.screenMat);
    this.screenMesh.position.set(0, 11, -14); // Elevado detrás del fondo norte
    this.scene.add(this.screenMesh);
  }

  updateScore(scoreText, teamNamesText) {
    if (!this.screenMesh) return;
    const newTex = this._generateScoreboardTexture(scoreText, teamNamesText);
    this.screenMat.map = newTex;
    this.screenMat.emissiveMap = newTex;
    this.screenMat.needsUpdate = true;
  }

  _generateScoreboardTexture(scoreText, teamNamesText) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const ctx = c.getContext('2d');

    // Base oscura de marcador LED
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 492, 236);

    // Encabezado
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = 'bold 16px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(teamNamesText.toUpperCase(), 256, 48);

    // Score Central Gigante
    ctx.fillStyle = '#00ff87';
    ctx.font = 'bold 72px Outfit, monospace';
    ctx.fillText(scoreText, 256, 136);

    // Sub-estadísticas
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.fillText('🏆 PADEL PRO TOUR 2027 · LIVE', 256, 210);

    return new THREE.CanvasTexture(c);
  }
}

window.ScreenManager = ScreenManager;

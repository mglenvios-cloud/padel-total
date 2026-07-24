/**
 * SponsorManager - Administra los carteles publicitarios LED y su rotación dinámica.
 */
class SponsorManager {
  constructor(scene) {
    this.scene = scene;
    this.boards = [];
    this.timer = 0;
    this.activeSponsorIdx = 0;
    this.sponsors = [
      '⚡ PADEL PRO EVO',
      '🌟 AI GRAPHICS STUDIO',
      '🔥 WEBGPU POWERED',
      '🏆 PADEL TOUR 2027'
    ];
  }

  buildBanners() {
    // Crear carteles publicitarios en los extremos de la pista (Z = 12, Z = -12)
    const bannerGeo = new THREE.BoxGeometry(8, 0.6, 0.1);
    const canvasTex = this._generateBannerTexture(this.sponsors[0]);

    this.boardMat = new THREE.MeshStandardMaterial({
      map: canvasTex,
      emissiveMap: canvasTex,
      emissive: 0xffffff,
      emissiveIntensity: 0.65
    });

    const board1 = new THREE.Mesh(bannerGeo, this.boardMat);
    board1.position.set(0, 0.3, 11.2);
    this.scene.add(board1);
    this.boards.push(board1);

    const board2 = board1.clone();
    board2.position.z = -11.2;
    board2.rotation.y = Math.PI;
    this.scene.add(board2);
    this.boards.push(board2);
  }

  update(dt) {
    this.timer += dt;
    // Rotar anuncio cada 4 segundos
    if (this.timer > 4.0) {
      this.timer = 0;
      this.activeSponsorIdx = (this.activeSponsorIdx + 1) % this.sponsors.length;
      
      const newTex = this._generateBannerTexture(this.sponsors[this.activeSponsorIdx]);
      this.boardMat.map = newTex;
      this.boardMat.emissiveMap = newTex;
      this.boardMat.needsUpdate = true;
    }
  }

  _generateBannerTexture(text) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 64;
    const ctx = c.getContext('2d');

    // Fondo de cartel LED deportivo
    ctx.fillStyle = '#050a14';
    ctx.fillRect(0, 0, 512, 64);

    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 56);

    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 24px Outfit, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 32);

    return new THREE.CanvasTexture(c);
  }
}

window.SponsorManager = SponsorManager;

/**
 * LoadingScreen - Controla la pantalla de carga e indicador de porcentaje de assets.
 */
class LoadingScreen {
  constructor() {
    this.container = null;
    this.progressBar = null;
    this.percentText = null;
    this.setupUI();
  }

  setupUI() {
    const loaderDiv = document.createElement('div');
    loaderDiv.id = 'web-loader-screen';
    loaderDiv.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background-color:#020617;z-index:9999;display:flex;flex-direction:column;justify-content:center;align-items:center;font-family:Rajdhani, sans-serif;color:#ffffff;';

    loaderDiv.innerHTML = `
      <div style="font-size:32px;font-weight:bold;color:#00d4ff;letter-spacing:4px;margin-bottom:20px;text-transform:uppercase;">Padel Pro Evolution 2027</div>
      <div style="width:280px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin-bottom:10px;">
        <div id="loader-progress-bar" style="width:0%;height:100%;background:#00d4ff;transition:width 0.1s ease-out;"></div>
      </div>
      <div id="loader-percent-text" style="font-size:14px;color:rgba(255,255,255,0.6);">CARGANDO: 0%</div>
    `;

    document.body.appendChild(loaderDiv);
    this.container = loaderDiv;
    this.progressBar = document.getElementById('loader-progress-bar');
    this.percentText = document.getElementById('loader-percent-text');
  }

  updateProgress(percent) {
    if (this.progressBar && this.percentText) {
      const p = Math.max(0, Math.min(100, percent));
      this.progressBar.style.width = `${p}%`;
      this.percentText.textContent = `CARGANDO: ${Math.round(p)}%`;
      
      if (p >= 100) {
        setTimeout(() => this.hide(), 300);
      }
    }
  }

  hide() {
    if (this.container) {
      this.container.style.transition = 'opacity 0.4s ease';
      this.container.style.opacity = '0';
      setTimeout(() => {
        if (this.container.parentNode) {
          this.container.parentNode.removeChild(this.container);
        }
      }, 400);
    }
  }
}

window.LoadingScreen = LoadingScreen;

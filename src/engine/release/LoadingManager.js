/**
 * LoadingManager (Release) - Gestor de pantallas de carga inicial y precarga progresiva.
 */
class LoadingManager {
  constructor() {
    this.progress = 0;
  }

  simulateLoading(onComplete) {
    console.log('Loading Manager: Iniciando precarga de assets 3D, texturas y sonidos...');
    const interval = setInterval(() => {
      this.progress += 20;
      console.log(`Carga: ${this.progress}% completado.`);
      if (this.progress >= 100) {
        clearInterval(interval);
        console.log('Loading Manager: Recursos listos. Iniciando motor de juego.');
        if (onComplete) onComplete();
      }
    }, 100);
  }
}

window.LoadingManager = LoadingManager;

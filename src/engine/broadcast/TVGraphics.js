/**
 * TVGraphics - Dibuja el HUD y los marcadores superpuestos de estilo televisión.
 */
class TVGraphics {
  constructor() {
    this.overlay = null;
    this.setupUI();
  }

  setupUI() {
    // Interfaz limpia desactivada para visión despejada del partido
    this.overlay = null;
  }

  update(speedKmh, playerName, elo = 1500) {
    // Sin elementos en pantalla que molesten la visión
  }
}

window.TVGraphics = TVGraphics;

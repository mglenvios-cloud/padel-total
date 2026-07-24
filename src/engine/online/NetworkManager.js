/**
 * NetworkManager - Administrador de la conexión de red WebSocket y validaciones básicas.
 */
class NetworkManager {
  constructor() {
    this.ws = null;
    this.token = null;
  }

  connect(url, token) {
    this.token = token;
    console.log(`NetworkManager: Conectando a sala multijugador con token JWT...`);
    
    // Simular conexión segura
    this.ws = {
      readyState: 1, // OPEN
      send: (data) => console.log(`NetworkManager: Enviando payload ->`, data),
      close: () => console.log('NetworkManager: Conexión cerrada.')
    };
  }

  sendState(payload) {
    if (this.ws && this.ws.readyState === 1) {
      // Validación básica anti-cheat de coordenadas en el envío
      if (Math.abs(payload.x) > 6.0 || Math.abs(payload.z) > 12.0) {
        console.warn('NetworkManager: Anti-cheat detectó posición anómala. Validando...');
        return;
      }
      this.ws.send(JSON.stringify(payload));
    }
  }
}

window.NetworkManager = NetworkManager;

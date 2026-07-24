/**
 * RealtimeServer - Simula el backend de WebSocket en tiempo real con soporte de reconexión.
 */
class RealtimeServer {
  constructor() {
    this.connected = false;
    this.reconnectAttempts = 0;
  }

  connect(roomId) {
    console.log(`Servidor Realtime: Conectando a sala '${roomId}'...`);
    this.connected = true;
  }

  triggerDisconnect() {
    this.connected = false;
    console.warn('Servidor Realtime: Desconexión detectada. Iniciando reconexión automática...');
    this._reconnect();
  }

  _reconnect() {
    if (this.connected) return;
    this.reconnectAttempts++;
    setTimeout(() => {
      console.log(`Servidor Realtime: Intento de reconexión #${this.reconnectAttempts}`);
      this.connected = true;
      this.reconnectAttempts = 0;
      console.log('Servidor Realtime: ¡Conexión restablecida con éxito!');
    }, 1500);
  }
}

window.RealtimeServer = RealtimeServer;

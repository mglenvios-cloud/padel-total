/**
 * NetworkCore - Núcleo de red multijugador para serializar paquetes y medir latencias (Ping).
 */
class NetworkCore {
  constructor() {
    this.ping = 30; // 30ms promedio
    this.serverTimeOffset = 0;
  }

  pingPong() {
    const start = Date.now();
    // Simular viaje de paquete de ida y vuelta
    setTimeout(() => {
      this.ping = Date.now() - start;
      // console.log(`Red Core: Ping medido -> ${this.ping}ms`);
    }, this.ping);
  }
}

window.NetworkCore = NetworkCore;

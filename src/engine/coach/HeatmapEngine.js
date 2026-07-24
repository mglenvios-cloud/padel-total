/**
 * HeatmapEngine - Registra las zonas calientes y el posicionamiento ideal en la cancha.
 */
class HeatmapEngine {
  constructor() {
    this.heatMapData = {};
  }

  registerPosition(x, z) {
    // Redondear a celdas de cuadrícula discretas de 1m x 1m para el mapa
    const gridKey = `${Math.round(x)}_${Math.round(z)}`;
    this.heatMapData[gridKey] = (this.heatMapData[gridKey] || 0) + 1;
  }

  getHotspot() {
    let maxVisits = 0;
    let hotZone = 'Cerca de red';
    
    for (let key in this.heatMapData) {
      if (this.heatMapData[key] > maxVisits) {
        maxVisits = this.heatMapData[key];
        const [x, z] = key.split('_').map(Number);
        hotZone = z > 5.0 ? 'Fondo de pista' : 'Zona de ataque / red';
      }
    }
    return hotZone;
  }
}

window.HeatmapEngine = HeatmapEngine;

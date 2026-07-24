/**
 * LagCompensation - Retrocede las coordenadas físicas al instante del impacto para compensar lag.
 */
class LagCompensation {
  constructor() {
    this.historyLimit = 60; // Conservar 1 segundo a 60Hz
  }

  adjustHitCheck(positionHistory, pingMs) {
    const ticksBack = Math.round(pingMs / 16.6); // 16.6ms por frame
    const index = Math.min(positionHistory.length - 1, ticksBack);
    
    // Retornar la coordenada del oponente en el pasado
    const historicalPos = positionHistory[positionHistory.length - 1 - index];
    console.log(`LagCompensation: Compensando impacto. Retroceso de ${ticksBack} frames (histórico:`, historicalPos, `)`);
    return historicalPos;
  }
}

window.LagCompensation = LagCompensation;

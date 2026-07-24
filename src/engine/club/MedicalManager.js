/**
 * MedicalManager - Controla fatiga acumulada, prevención de lesiones y tiempos de baja.
 */
class MedicalManager {
  constructor() {
    this.fatigue = 0; // 0-100%
    this.injuryStatus = null; // null o { name, weeksLeft }
  }

  checkPostMatch(rallyLength, intensityFactor) {
    // Aumentar fatiga
    this.fatigue = Math.min(100, this.fatigue + intensityFactor * 6.5);
    
    // Probabilidad de lesión si la fatiga es alta
    if (this.fatigue > 80 && Math.random() < 0.15) {
      this.injuryStatus = { name: 'Esguince de tobillo', weeksLeft: 2 };
      console.warn(`Médico: ¡Jugador lesionado! Diagnóstico: ${this.injuryStatus.name} (${this.injuryStatus.weeksLeft} semanas de baja)`);
    } else {
      console.log(`Médico: Informe post-partido. Fatiga del jugador: ${Math.round(this.fatigue)}%`);
    }
  }

  rehabilitate() {
    if (this.injuryStatus) {
      this.injuryStatus.weeksLeft--;
      if (this.injuryStatus.weeksLeft <= 0) {
        console.log('Médico: ¡Jugador recuperado y listo para competir!');
        this.injuryStatus = null;
      }
    }
    this.fatigue = Math.max(0, this.fatigue - 25); // Recuperación semanal
  }
}

window.MedicalManager = MedicalManager;

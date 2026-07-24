/**
 * TrainingCenter - Planificación y sesiones de entrenamiento del primer equipo.
 */
class TrainingCenter {
  constructor() {
    this.activeDrill = 'táctica';
  }

  runSession(drillType, playerStats) {
    this.activeDrill = drillType;
    console.log(`Entrenamiento: Ejecutada sesión de '${drillType}'`);
    
    // Aumentar atributo sutilmente en base al foco de entrenamiento
    if (playerStats[drillType] !== undefined && playerStats[drillType] < 99) {
      playerStats[drillType] += 0.5;
      console.log(`Entrenamiento: Atributo '${drillType}' mejorado a ${playerStats[drillType]}`);
    }
  }
}

window.TrainingCenter = TrainingCenter;

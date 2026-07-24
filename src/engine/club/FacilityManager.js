/**
 * FacilityManager - Gestiona las instalaciones del club (canchas, gimnasio, academia).
 */
class FacilityManager {
  constructor() {
    this.facilities = {
      mainCourt: 1,      // Nivel 1-10
      trainingCourts: 1,
      gym: 1,
      medicalCenter: 1
    };
  }

  upgradeFacility(name) {
    if (this.facilities[name] !== undefined && this.facilities[name] < 10) {
      this.facilities[name]++;
      console.log(`Facilities: Instalación '${name}' mejorada al nivel ${this.facilities[name]}`);
      return true;
    }
    return false;
  }
}

window.FacilityManager = FacilityManager;

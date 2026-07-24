/**
 * StaffManager - Cuerpo técnico del club (entrenadores, médicos, ojeadores).
 */
class StaffManager {
  constructor() {
    this.staff = {
      headCoach: null,
      scout: null,
      physio: null
    };
  }

  hireStaff(role, name, rating, cost) {
    this.staff[role] = { name, rating, cost };
    console.log(`Cuerpo Técnico: Contratado '${name}' como '${role}' (Efectividad: ${rating})`);
  }
}

window.StaffManager = StaffManager;

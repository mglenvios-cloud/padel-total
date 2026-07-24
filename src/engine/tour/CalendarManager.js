/**
 * CalendarManager - Calendario anual estructurado en 52 semanas para torneos y descansos.
 */
class CalendarManager {
  constructor() {
    this.currentWeek = 1;
    this.schedule = {
      1: { eventId: 'ts_03', city: 'Buenos Aires', resting: false },
      12: { eventId: 'ts_01', city: 'Madrid', resting: false },
      24: { eventId: 'ts_02', city: 'París', resting: false },
      52: { eventId: 'ts_finals', city: 'Dubái', resting: false }
    };
  }

  nextWeek() {
    this.currentWeek = (this.currentWeek % 52) + 1;
    console.log(`Calendario Tour: Entrando en la Semana ${this.currentWeek}`);
    return this.schedule[this.currentWeek] || { eventId: null, city: 'Descanso', resting: true };
  }
}

window.CalendarManager = CalendarManager;

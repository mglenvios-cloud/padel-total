class CareerManager {
  constructor() {
    this.currentSeason = 1;
    this.calendarWeek = 1;
    this.objectives = ["Ganar tu primer torneo", "Alcanzar el Top 50"];
    this.progress = 0;
    this.narrativeEvents = [];
  }

  nextWeek() {
    this.calendarWeek++;
    if (this.calendarWeek > 52) {
      this.calendarWeek = 1;
      this.currentSeason++;
    }
  }
}
if (typeof module !== 'undefined') module.exports = CareerManager;
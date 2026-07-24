/**
 * TourManager - Fachada principal y administrador del circuito profesional mundial de pádel.
 */
class TourManager {
  constructor() {
    this.calendar = new CalendarManager();
    this.ranking = new RankingWorld();
    this.prizes = new PrizeMoneyManager();
    this.travel = new TravelManager();
    this.simulator = new TournamentSimulator();
    this.grandFinal = new GrandFinalManager();
    this.fame = new HallOfFame();
    this.history = new SeasonHistory();
  }

  processWeeklyTick() {
    const nextEvent = this.calendar.nextWeek();
    
    if (nextEvent.resting) {
      console.log('Tour: Semana de descanso y recuperación.');
      return;
    }

    const eventData = TournamentDatabase.getEvent(nextEvent.eventId);
    console.log(`Tour: Iniciando torneo '${eventData.name}' (${eventData.type}) en la ciudad de ${nextEvent.city}`);
    
    // Viajar
    this.travel.travelTo(nextEvent.city, 1200);
  }
}

window.TourManager = TourManager;

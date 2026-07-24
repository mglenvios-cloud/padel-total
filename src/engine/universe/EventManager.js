/**
 * EventManager (Universe) - Despacha eventos en vivo, copas especiales y retos diarios.
 */
class EventManager {
  constructor() {
    this.dailyChallenges = [
      { id: 'ch_1', description: 'Gana 2 partidos sin perder sets', reward: 300 },
      { id: 'ch_2', description: 'Logra 5 winners con smash', reward: 150 }
    ];
  }

  getChallenges() {
    return this.dailyChallenges;
  }
}

window.EventManager = EventManager;

/**
 * CreatorTools - Herramientas para que creadores organicen torneos y eventos personalizados.
 */
class CreatorTools {
  constructor() {
    this.customEvents = [];
  }

  createCustomTournament(organizerId, name, prizeAmount) {
    const customEvent = {
      id: `ev_c_${Date.now()}`,
      organizer: organizerId,
      name,
      prize: prizeAmount
    };
    this.customEvents.push(customEvent);
    console.log(`Creator Tools: Creado torneo de comunidad '${name}'`);
    return customEvent;
  }
}

window.CreatorTools = CreatorTools;

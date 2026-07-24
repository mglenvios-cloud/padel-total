/**
 * TravelManager - Gestiona costes de viaje, fatiga del viaje y jet lag adaptativo.
 */
class TravelManager {
  constructor() {
    this.currentCity = 'Madrid';
  }

  travelTo(destinationCity, distanceKm) {
    if (this.currentCity === destinationCity) return 0; // Sin viaje necesario
    
    this.currentCity = destinationCity;
    const ticketCost = Math.round(distanceKm * 0.45);
    const jetLagFatigue = Math.round(distanceKm * 0.005); // 5% fatiga por cada 1000km

    console.log(`Viajes: Viajando a ${destinationCity}. Coste pasajes: -${ticketCost} Monedas. Fatiga de jet lag: +${jetLagFatigue}%`);
    return { cost: ticketCost, fatigue: jetLagFatigue };
  }
}

window.TravelManager = TravelManager;

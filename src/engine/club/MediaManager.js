/**
 * MediaManager - Simula noticias, entrevistas y ruedas de prensa post-partido.
 */
class MediaManager {
  constructor() {
    this.pressReputation = 50; // Prestigio con la prensa 1-100
  }

  generateNewsArticle(playerName, matchResultText) {
    const Headlines = [
      `Diario Deportivo: Espectacular victoria de ${playerName}.`,
      `El Mundo del Pádel: ${playerName} analiza el resultado: "${matchResultText}"`,
      `Pádel Inside: La afición ovaciona el juego de ${playerName}.`
    ];
    const text = Headlines[Math.floor(Math.random() * Headlines.length)];
    console.log(`Media: ${text}`);
    return text;
  }
}

window.MediaManager = MediaManager;

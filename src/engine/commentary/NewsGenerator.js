/**
 * NewsGenerator - Publica artículos de noticias deportivas al finalizar el torneo.
 */
class NewsGenerator {
  constructor() {}

  writeReport(playerName, tournamentName, winStatus) {
    const text = winStatus
      ? `🚨 EXCLUSIVA: ¡${playerName} se corona campeón del ${tournamentName}! La red tembló con su nivel.`
      : `Diario Pádel: ${playerName} cae en las rondas clasificatorias del ${tournamentName}. Toca reagrupar.`;
    
    console.log(`Prensa: ${text}`);
    return text;
  }
}

window.NewsGenerator = NewsGenerator;

/**
 * HallOfFame - Registro histórico de títulos logrados, récords y leyendas del deporte.
 */
class HallOfFame {
  constructor() {
    this.records = [
      { player: 'Maya', titles: 42, recordType: 'Más títulos Masters ganados' }
    ];
  }

  recordLegend(playerName, recordsCount) {
    this.records.push({ player: playerName, titles: recordsCount, recordType: 'Leyenda del Club' });
    console.log(`Salón de la Fama: Inmortalizado ${playerName} con ${recordsCount} títulos.`);
  }
}

window.HallOfFame = HallOfFame;

/**
 * CommunityManager - Administra los boletines informativos y la comunidad del juego.
 */
class CommunityManager {
  constructor() {
    this.bulletins = [
      { id: 1, title: 'Parche 1.04: Mejoras en el lobby 2v2', date: '2027-02-14' }
    ];
  }

  getNews() {
    return this.bulletins;
  }
}

window.CommunityManager = CommunityManager;

class AchievementManager {
  constructor() {
    this.achievements = this.generateAchievementsList();
  }

  generateAchievementsList() {
    const list = [];
    for (let i = 1; i <= 105; i++) {
      list.push({
        id: i,
        title: `Logro #${i}`,
        description: `Desbloquea el nivel de maestría deportiva ${i}.`,
        unlocked: false
      });
    }
    // Específicos
    list[0] = { id: 1, title: "Primer Partido", description: "Juega tu primera partida de pádel 3D.", unlocked: false };
    list[1] = { id: 2, title: "Primer Torneo", description: "Inscríbete en un torneo oficial.", unlocked: false };
    list[2] = { id: 3, title: "Top 100", description: "Entra en el top 100 mundial.", unlocked: false };
    return list;
  }
}
if (typeof module !== 'undefined') module.exports = AchievementManager;
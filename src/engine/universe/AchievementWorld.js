/**
 * AchievementWorld - Registra récords mundiales e insignias logradas por la comunidad.
 */
class AchievementWorld {
  constructor() {
    this.achievements = [
      { id: 'ach_wins_100', name: 'Centenario', description: 'Logra 100 victorias online', unlocked: false }
    ];
  }

  unlock(id) {
    const ach = this.achievements.find(a => a.id === id);
    if (ach && !ach.unlocked) {
      ach.unlocked = true;
      console.log(`Logros Universo: ¡Desbloqueado -> ${ach.name}!`);
    }
  }
}

window.AchievementWorld = AchievementWorld;

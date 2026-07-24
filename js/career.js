// ============================================================
// CAREER.JS — Dynamic Script Loader & Integration Layer
// ============================================================

(function() {
  const managers = [
    'PlayerManager', 'CareerManager', 'ClubManager', 'TournamentManager',
    'RankingManager', 'SeasonManager', 'SaveManager', 'AchievementManager',
    'SponsorManager', 'CoachManager', 'TrainingManager', 'StatisticsManager',
    'FinanceManager', 'ContractManager', 'NewsManager'
  ];

  function loadScript(name) {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = `src/career/${name}.js`;
      script.onload = () => resolve();
      script.onerror = () => resolve(); // no bloquear si falla
      document.head.appendChild(script);
    });
  }

  // Carga paralela de los módulos de la Fase 6.1
  Promise.all(managers.map(m => loadScript(m))).then(() => {
    try {
      class CareerMode {
        constructor() {
          try { this.player = new PlayerManager({}); } catch(e) { this.player = null; }
          try { this.career = new CareerManager(); } catch(e) { this.career = null; }
          try { this.club = new CareerClubManager(); } catch(e) { this.club = null; }
          try { this.tournament = new TournamentManager(); } catch(e) { this.tournament = null; }
          try { this.ranking = new CareerRankingManager(); } catch(e) { this.ranking = null; }
          try { this.season = new CareerSeasonManager(); } catch(e) { this.season = null; }
          try { this.achievements = new CareerAchievementManager(); } catch(e) { this.achievements = null; }
          try { this.sponsors = new CareerSponsorManager(); } catch(e) { this.sponsors = null; }
          try { this.trainings = new TrainingManager(); } catch(e) { this.trainings = null; }
          try { this.stats = new StatisticsManager(); } catch(e) { this.stats = null; }
          try { this.finances = new FinanceManager(); } catch(e) { this.finances = null; }
          try { this.contracts = new CareerContractManager(); } catch(e) { this.contracts = null; }
          try { this.news = new NewsManager(); } catch(e) { this.news = null; }
        }

        gainXP(amount) {
          try { if (this.player && this.player.gainXP(amount)) console.log("AI Career: ¡Subida de Nivel!"); } catch(e) {}
        }

        generateTournament(type = 'Cup') {
          try { return this.tournament ? this.tournament.generateBracket(type) : null; } catch(e) { return null; }
        }
      }

      window.career = new CareerMode();
      console.log("⚡ Professional Career System Loaded under src/career/");
    } catch(e) {
      console.warn('CareerMode init failed:', e.message);
    }
  });
})();

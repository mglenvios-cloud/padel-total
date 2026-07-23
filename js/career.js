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
      document.head.appendChild(script);
    });
  }

  // Carga paralela de los módulos de la Fase 6.1
  Promise.all(managers.map(m => loadScript(m))).then(() => {
    class CareerMode {
      constructor() {
        this.player = new PlayerManager({});
        this.career = new CareerManager();
        this.club = new ClubManager();
        this.tournament = new TournamentManager();
        this.ranking = new RankingManager();
        this.season = new SeasonManager();
        this.achievements = new AchievementManager();
        this.sponsors = new SponsorManager();
        this.trainings = new TrainingManager();
        this.stats = new StatisticsManager();
        this.finances = new FinanceManager();
        this.contracts = new ContractManager();
        this.news = new NewsManager();
        
        this.loadData();
      }

      async loadData() {
        const data = await SaveManager.loadOffline('padel_career_data');
        if (data) {
          if (data.player) this.player = new PlayerManager(data.player);
          if (data.club) this.club = new ClubManager(data.club);
        }
      }

      saveData() {
        const data = {
          player: this.player,
          club: this.club
        };
        SaveManager.saveOffline('padel_career_data', data);
      }
      
      gainXP(amount) {
        if (this.player.gainXP(amount)) {
          console.log("AI Career: ¡Subida de Nivel!");
        }
        this.saveData();
      }

      generateTournament(type = 'Cup') {
        return this.tournament.generateBracket(type);
      }
    }

    window.career = new CareerMode();
    window.aiCoach = CoachManager;
    console.log("⚡ Professional Career System Loaded and Modularized under src/career/");
  });
})();

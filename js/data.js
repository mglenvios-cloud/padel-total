// ============================================================
// DATA.JS — Perfil, estadísticas, localStorage, ranking simulado
// ============================================================

const DEFAULT_PROFILE = {
  name: 'Jugador',
  age: 25,
  nationality: 'AR',
  hand: 'right',
  style: 'balanced',
  paddleColor: '#00d4ff',
  wins: 0,
  losses: 0,
  rating: 1000,
  matches: [],
  aces: 0,
  winners: 0,
  errors: 0
};

const SIMULATED_PLAYERS = [
  { name: 'Juan Lebrón',    country: '🇪🇸', rating: 2840, wins: 312, losses: 45 },
  { name: 'Ale Galán',      country: '🇪🇸', rating: 2810, wins: 298, losses: 52 },
  { name: 'Arturo Coello',  country: '🇪🇸', rating: 2775, wins: 276, losses: 60 },
  { name: 'Agustín Tapia',  country: '🇦🇷', rating: 2750, wins: 260, losses: 68 },
  { name: 'Franco Stupaczuk', country: '🇦🇷', rating: 2710, wins: 241, losses: 74 },
  { name: 'Fede Chingotto', country: '🇦🇷', rating: 2690, wins: 234, losses: 80 },
  { name: 'Paquito Navarro', country: '🇪🇸', rating: 2650, wins: 220, losses: 88 },
  { name: 'Martin Di Nenno', country: '🇦🇷', rating: 2620, wins: 208, losses: 95 },
  { name: 'Lucía Sainz',    country: '🇪🇸', rating: 2590, wins: 195, losses: 102 },
  { name: 'Marta Ortega',   country: '🇪🇸', rating: 2560, wins: 184, losses: 110 },
];

const DataManager = {
  getProfile() {
    try {
      const saved = localStorage.getItem('padel_profile');
      return saved ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) } : { ...DEFAULT_PROFILE };
    } catch { return { ...DEFAULT_PROFILE }; }
  },

  saveProfile(profile) {
    try { localStorage.setItem('padel_profile', JSON.stringify(profile)); } catch {}
  },

  recordMatch(won, sets, myScore, opponentScore, mode) {
    const profile = this.getProfile();
    if (won) profile.wins++; else profile.losses++;
    const ratingChange = won ? Math.floor(20 + Math.random() * 15) : -Math.floor(10 + Math.random() * 15);
    profile.rating = Math.max(800, profile.rating + ratingChange);
    profile.matches = profile.matches || [];
    profile.matches.unshift({
      date: new Date().toLocaleDateString('es-AR'),
      result: won ? 'Victoria' : 'Derrota',
      score: `${myScore}-${opponentScore}`,
      mode,
      ratingChange
    });
    if (profile.matches.length > 20) profile.matches.pop();
    this.saveProfile(profile);
    return { ratingChange };
  },

  getWinRate(profile) {
    const total = profile.wins + profile.losses;
    if (total === 0) return '-';
    return Math.round((profile.wins / total) * 100) + '%';
  },

  getRanking(profile) {
    const all = [...SIMULATED_PLAYERS];
    const me = { name: profile.name, country: '⭐', rating: profile.rating, wins: profile.wins, losses: profile.losses, isMe: true };
    all.push(me);
    all.sort((a, b) => b.rating - a.rating);
    return all;
  }
};

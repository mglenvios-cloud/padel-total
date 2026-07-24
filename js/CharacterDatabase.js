/**
 * CharacterDatabase - Base de datos estática para jugadores, árbitros y entrenadores.
 */
const CharacterDatabase = {
  presets: {
    players: {
      0: {
        name: "Jugador",
        gender: "male",
        height: 1.82,
        weight: 78,
        skinTone: 0xd4a574,
        hairStyle: "short",
        hairColor: 0x22150a,
        dominantHand: "right",
        uniform: { shirtColor: "#00d4ff", pantsColor: "#1b1f26", number: 7 }
      },
      1: {
        name: "Maya",
        gender: "female",
        height: 1.74,
        weight: 62,
        skinTone: 0xe0b388,
        hairStyle: "ponytail",
        hairColor: 0x4a3728,
        dominantHand: "right",
        uniform: { shirtColor: "#7c3aed", pantsColor: "#1b1f26", number: 10 }
      },
      2: {
        name: "Ramos",
        gender: "male",
        height: 1.88,
        weight: 84,
        skinTone: 0xc68e5c,
        hairStyle: "spiky",
        hairColor: 0x111111,
        dominantHand: "right",
        uniform: { shirtColor: "#ff6b35", pantsColor: "#1b1f26", number: 9 }
      },
      3: {
        name: "Chen",
        gender: "male",
        height: 1.78,
        weight: 70,
        skinTone: 0xffd2a1,
        hairStyle: "fade",
        hairColor: 0x050505,
        dominantHand: "left",
        uniform: { shirtColor: "#00ff87", pantsColor: "#1b1f26", number: 1 }
      }
    },
    referee: {
      name: "Árbitro",
      role: "referee",
      height: 1.80,
      weight: 75,
      skinTone: 0xd4a574,
      uniform: { shirtColor: "#ffffff", pantsColor: "#111111" }
    },
    coach: {
      name: "Entrenador",
      role: "coach",
      height: 1.85,
      weight: 80,
      skinTone: 0xd4a574,
      uniform: { shirtColor: "#222222", pantsColor: "#333333" }
    }
  },

  getPreset(type, id) {
    if (type === 'player' || type === 'players') {
      return this.presets.players[id] || this.presets.players[0];
    }
    return this.presets[type] || this.presets.players[0];
  }
};

window.CharacterDatabase = CharacterDatabase;

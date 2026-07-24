/**
 * ClubOnlineManager - Administra los clubes, equipos y torneos internos online.
 */
class ClubOnlineManager {
  constructor() {
    this.activeClub = null;
    this.members = [];
  }

  createClub(name) {
    this.activeClub = {
      name,
      level: 1,
      trophies: 0
    };
    console.log(`ClubOnline: Club '${name}' registrado con éxito en los servidores.`);
  }

  invitePlayer(playerName) {
    if (this.activeClub) {
      this.members.push(playerName);
      console.log(`ClubOnline: Invitación enviada a ${playerName}`);
    }
  }
}

window.ClubOnlineManager = ClubOnlineManager;

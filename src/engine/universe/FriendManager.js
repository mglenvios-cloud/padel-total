/**
 * FriendManager - Gestiona lista de amigos, solicitudes de amistad y estados de conexión.
 */
class FriendManager {
  constructor() {
    this.friends = [
      { onlineId: 'Ramos_ESP', status: 'online' },
      { onlineId: 'Maya_Arg', status: 'offline' }
    ];
  }

  addFriendRequest(targetId) {
    console.log(`Amigos: Solicitud de amistad enviada a ${targetId}`);
  }
}

window.FriendManager = FriendManager;

/**
 * SocialHub - Chat global, invitaciones a lobbies y salas de reunión.
 */
class SocialHub {
  constructor() {
    this.chatLog = [];
  }

  sendChatMessage(sender, text) {
    const msg = { sender, text, time: new Date().toLocaleTimeString() };
    this.chatLog.push(msg);
    if (this.chatLog.length > 50) this.chatLog.shift();
    console.log(`[CHAT] ${sender}: ${text}`);
  }
}

window.SocialHub = SocialHub;

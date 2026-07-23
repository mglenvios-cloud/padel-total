class SaveManager {
  static async saveOffline(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  }

  static async loadOffline(key) {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : null;
  }
}
if (typeof module !== 'undefined') module.exports = SaveManager;
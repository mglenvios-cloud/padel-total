/**
 * SaveBackup - Maneja copias de seguridad de guardado y redundancia para evitar corrupción de datos.
 */
class SaveBackup {
  constructor() {}

  createLocalBackup(key, dataString) {
    try {
      localStorage.setItem(`${key}_backup`, dataString);
      // console.log(`Backup: Copia de seguridad creada para la clave '${key}'`);
    } catch (e) {
      console.warn('Backup: Error al escribir copia redundante.', e);
    }
  }

  recoverFromBackup(key) {
    console.log(`Backup: Restaurando copia redundante para la clave '${key}'`);
    return localStorage.getItem(`${key}_backup`);
  }
}

window.SaveBackup = SaveBackup;

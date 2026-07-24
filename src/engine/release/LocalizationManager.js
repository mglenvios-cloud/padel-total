/**
 * LocalizationManager - Soporte multi-idiomas para menús e interfaz (ES, EN, PT, FR).
 */
class LocalizationManager {
  constructor() {
    this.currentLang = 'es';
    this.dictionary = {
      es: { start: 'INICIAR PARTIDO', options: 'OPCIONES', score: 'MARCADOR' },
      en: { start: 'START MATCH', options: 'OPTIONS', score: 'SCORE' },
      pt: { start: 'INICIAR PARTIDA', options: 'OPÇÕES', score: 'PLACAR' },
      fr: { start: 'LANCER LE MATCH', options: 'OPTIONS', score: 'SCORE' }
    };
  }

  setLanguage(langCode) {
    if (this.dictionary[langCode]) {
      this.currentLang = langCode;
      console.log(`Idiomas: Idioma cambiado a '${langCode}'`);
    }
  }

  translate(key) {
    return (this.dictionary[this.currentLang] && this.dictionary[this.currentLang][key]) || key;
  }
}

window.LocalizationManager = LocalizationManager;

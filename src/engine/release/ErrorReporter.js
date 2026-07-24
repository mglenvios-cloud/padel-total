/**
 * ErrorReporter - Captura de forma segura excepciones JS, fallos de red y genera informes.
 */
class ErrorReporter {
  constructor() {
    this.setupGlobalHook();
  }

  setupGlobalHook() {
    window.onerror = (message, source, lineno, colno, error) => {
      const errorMsg = `[CRASH] ${message} en ${source}:${lineno}:${colno}`;
      console.error('ErrorReporter:', errorMsg);
      // Simulación de envío a servidores de analítica/QA Sentry
      return false; // Permitir que corra el controlador nativo en consola
    };
  }
}

window.ErrorReporter = ErrorReporter;

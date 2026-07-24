/**
 * HighlightNarrator - Narrador deportivo enfocado en resumir y catalogar repeticiones.
 */
class HighlightNarrator {
  constructor() {}

  narrateHighlightClip(clipType) {
    if (clipType === 'smash') {
      return "¡Revivamos este smash destructor que dejó al rival sin respuesta!";
    }
    return "¡Qué punto tan disputado de principio a fin, puro espectáculo!";
  }
}

window.HighlightNarrator = HighlightNarrator;

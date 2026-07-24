/**
 * BlendTree - Mezclador de animaciones de locomoción en base a la velocidad.
 */
class BlendTree {
  constructor(animController) {
    this.anim = animController;
  }

  updateLocomotion(speed) {
    if (!this.anim) return;

    if (this.anim.activeAction && !this.anim.isActionLooping(this.anim.activeAction)) {
      return; // No interrumpir animaciones de golpe o una sola ejecución
    }

    let targetAnim = 'Idle';
    if (speed > 7.0 && this.anim.actions['Sprint']) {
      targetAnim = 'Sprint';
    } else if (speed > 3.0 && this.anim.actions['Run']) {
      targetAnim = 'Run';
    } else if (speed > 0.3 && this.anim.actions['Walk']) {
      targetAnim = 'Walk';
    } else if (this.anim.actions['Ready']) {
      targetAnim = 'Ready';
    }

    this.anim.fadeTo(targetAnim, 0.2);
  }
}

// Extensión para determinar si el clip es una locomoción cíclica
if (AnimationController && !AnimationController.prototype.isActionLooping) {
  AnimationController.prototype.isActionLooping = function(action) {
    return action.getClip().name.toLowerCase().match(/(idle|walk|run|sprint|ready)/) !== null;
  };
}

window.BlendTree = BlendTree;

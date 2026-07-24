/**
 * AnimationController - Controla las pistas y reproducción de animaciones.
 */
class AnimationController {
  constructor(mesh, animations) {
    this.mesh = mesh;
    this.animations = animations || [];
    this.mixer = new THREE.AnimationMixer(mesh);
    this.actions = {};
    this.activeAction = null;
    this.lastAction = null;
    this.lodLevel = 0;
    this.timeSinceLastUpdate = 0;

    this.initActions();
  }

  initActions() {
    this.animations.forEach((clip) => {
      const name = clip.name.toLowerCase();
      let mappedName = clip.name;

      if (name.includes('idle')) mappedName = 'Idle';
      else if (name.includes('ready')) mappedName = 'Ready';
      else if (name.includes('walk')) mappedName = 'Walk';
      else if (name.includes('run')) mappedName = 'Run';
      else if (name.includes('sprint')) mappedName = 'Sprint';
      else if (name.includes('split')) mappedName = 'Split Step';
      else if (name.includes('forehand')) mappedName = 'Forehand';
      else if (name.includes('backhand')) mappedName = 'Backhand';
      else if (name.includes('volley')) mappedName = 'Volley';
      else if (name.includes('smash')) mappedName = 'Smash';
      else if (name.includes('bandeja')) mappedName = 'Bandeja';
      else if (name.includes('vibora')) mappedName = 'Víbora';
      else if (name.includes('lob')) mappedName = 'Lob';
      else if (name.includes('recovery')) mappedName = 'Recovery';
      else if (name.includes('celebrate')) mappedName = 'Celebrate';

      const action = this.mixer.clipAction(clip);
      this.actions[mappedName] = action;
      
      if (['Forehand', 'Backhand', 'Volley', 'Smash', 'Bandeja', 'Víbora', 'Lob', 'Celebrate', 'Split Step'].includes(mappedName)) {
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
      }
    });

    this.fadeTo('Idle', 0);
  }

  fadeTo(name, duration = 0.25) {
    const action = this.actions[name];
    if (!action) return;
    if (this.activeAction === action) return;

    this.lastAction = this.activeAction;
    this.activeAction = action;

    if (this.lastAction) {
      this.lastAction.fadeOut(duration);
    }

    action
      .reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(duration)
      .play();
  }

  update(dt, distanceToCamera) {
    if (distanceToCamera > 45) this.lodLevel = 3;
    else if (distanceToCamera > 30) this.lodLevel = 2;
    else if (distanceToCamera > 15) this.lodLevel = 1;
    else this.lodLevel = 0;

    if (this.lodLevel === 3) return;

    this.timeSinceLastUpdate += dt;
    
    let shouldUpdate = false;
    if (this.lodLevel === 0) shouldUpdate = true;
    else if (this.lodLevel === 1 && this.timeSinceLastUpdate >= 0.033) shouldUpdate = true;
    else if (this.lodLevel === 2 && this.timeSinceLastUpdate >= 0.066) shouldUpdate = true;

    if (shouldUpdate) {
      this.mixer.update(this.timeSinceLastUpdate);
      this.timeSinceLastUpdate = 0;
    }
  }
}

window.AnimationController = AnimationController;

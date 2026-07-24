/**
 * AnimationController - Gestiona el AnimationMixer, transiciones (cross-fade), Blend Trees y LOD.
 */
class AnimationController {
  constructor(mesh, animations) {
    this.mesh = mesh;
    this.animations = animations || [];
    this.mixer = new THREE.AnimationMixer(mesh);
    this.actions = {};
    this.activeAction = null;
    this.lastAction = null;

    // LOD para rendimiento
    this.lodLevel = 0; // 0: Completo (cada frame), 1: 30 FPS, 2: 15 FPS, 3: Desactivar animación
    this.timeSinceLastUpdate = 0;

    this.initActions();
  }

  /**
   * Mapea e inicializa las acciones de animación encontradas en el GLB.
   */
  initActions() {
    this.animations.forEach((clip) => {
      const name = clip.name.toLowerCase();
      let mappedName = clip.name;

      // Mapear automáticamente nombres comunes
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
      
      // Golpes y celebraciones no deben repetirse en bucle por defecto
      if (['Forehand', 'Backhand', 'Volley', 'Smash', 'Bandeja', 'Víbora', 'Lob', 'Celebrate', 'Split Step'].includes(mappedName)) {
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
      }
    });

    // Reproducir Idle por defecto
    this.fadeTo('Idle', 0);
  }

  /**
   * Transición suave (cross-fade) a una nueva animación.
   */
  fadeTo(name, duration = 0.25) {
    const action = this.actions[name];
    if (!action) {
      // Si la animación solicitada no existe, buscar una similar o retornar
      return;
    }

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

  /**
   * Blend Tree simple: Mezcla Idle, Walk, Run y Sprint según la velocidad.
   */
  updateLocomotion(speed) {
    if (this.activeAction && !this.isActionLooping(this.activeAction)) {
      // Si está reproduciendo una acción una sola vez (ej: golpeando), no sobreescribir con locomoción
      return;
    }

    let targetAnim = 'Idle';
    if (speed > 7.0 && this.actions['Sprint']) {
      targetAnim = 'Sprint';
    } else if (speed > 3.0 && this.actions['Run']) {
      targetAnim = 'Run';
    } else if (speed > 0.3 && this.actions['Walk']) {
      targetAnim = 'Walk';
    } else if (this.actions['Ready']) {
      targetAnim = 'Ready';
    }

    this.fadeTo(targetAnim, 0.2);
  }

  /**
   * Determina si la acción es cíclica (correr, caminar, reposar).
   */
  isActionLooping(action) {
    return action.getClip().name.toLowerCase().match(/(idle|walk|run|sprint|ready)/) !== null;
  }

  /**
   * Ajusta el nivel de LOD según la distancia a la cámara.
   */
  updateLOD(distanceToCamera) {
    if (distanceToCamera > 45) {
      this.lodLevel = 3; // Detener animación para máxima optimización
    } else if (distanceToCamera > 30) {
      this.lodLevel = 2; // Actualizar a 15 FPS
    } else if (distanceToCamera > 15) {
      this.lodLevel = 1; // Actualizar a 30 FPS
    } else {
      this.lodLevel = 0; // Actualizar a 60/120 FPS completos
    }
  }

  /**
   * Actualiza el mezclador de animaciones respetando el LOD.
   */
  update(dt, distanceToCamera) {
    if (distanceToCamera !== undefined) {
      this.updateLOD(distanceToCamera);
    }

    if (this.lodLevel === 3) return;

    this.timeSinceLastUpdate += dt;
    
    let shouldUpdate = false;
    if (this.lodLevel === 0) {
      shouldUpdate = true;
    } else if (this.lodLevel === 1 && this.timeSinceLastUpdate >= 0.033) {
      shouldUpdate = true;
    } else if (this.lodLevel === 2 && this.timeSinceLastUpdate >= 0.066) {
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      this.mixer.update(this.timeSinceLastUpdate);
      this.timeSinceLastUpdate = 0;
    }
  }
}

// Exportar globalmente
window.AnimationController = AnimationController;

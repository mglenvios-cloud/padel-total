/**
 * PlayerRig - Gestiona la jerarquía de huesos y los puntos de acoplamiento (pala, gorra, etc.)
 */
class PlayerRig {
  constructor(scene, isHuman = false) {
    this.scene = scene;
    this.isHuman = isHuman;
    this.bones = {};
    this.attachments = new Map();
    this.meshMapping = {};

    this.mapSkeleton();
  }

  /**
   * Identifica y mapea automáticamente los huesos comunes del esqueleto humanoide
   * (compatible con Mixamo, Ready Player Me, Rokoko, Blender, etc.).
   */
  mapSkeleton() {
    this.scene.traverse(node => {
      if (node.isBone) {
        const name = node.name.toLowerCase();
        
        if (name.includes('hips') || name.includes('pelvis') || name.includes('root')) {
          this.bones.hips = node;
        } else if (name.includes('spine') || name.includes('torso')) {
          this.bones.spine = node;
        } else if (name.includes('neck')) {
          this.bones.neck = node;
        } else if (name.includes('head')) {
          this.bones.head = node;
        } else if (name.includes('righthand') || (name.includes('hand') && name.includes('r'))) {
          this.bones.rightHand = node;
        } else if (name.includes('lefthand') || (name.includes('hand') && name.includes('l'))) {
          this.bones.leftHand = node;
        } else if (name.includes('rightarm') || (name.includes('arm') && name.includes('r'))) {
          this.bones.rightArm = node;
        } else if (name.includes('leftarm') || (name.includes('arm') && name.includes('l'))) {
          this.bones.leftArm = node;
        } else if (name.includes('rightleg') || (name.includes('leg') && name.includes('r')) || name.includes('rightupleg')) {
          this.bones.rightLeg = node;
        } else if (name.includes('leftleg') || (name.includes('leg') && name.includes('l')) || name.includes('leftupleg')) {
          this.bones.leftLeg = node;
        }
      }
    });

    console.log('PlayerRig: Huesos mapeados:', Object.keys(this.bones));
  }

  /**
   * Acopla un objeto 3D (ej: pala, gorra, accesorios) a un hueso específico.
   */
  attachObject(boneName, object, positionOffset = new THREE.Vector3(), rotationOffset = new THREE.Euler()) {
    const bone = this.bones[boneName];
    if (!bone) {
      console.warn(`PlayerRig: No se encontró el hueso '${boneName}' para acoplar el objeto.`);
      return false;
    }

    // Remover acoplamiento previo del mismo tipo si existe
    this.detachObject(boneName);

    // Ajustar transformaciones relativas
    object.position.copy(positionOffset);
    object.rotation.copy(rotationOffset);

    bone.add(object);
    this.attachments.set(boneName, object);
    return true;
  }

  /**
   * Desacopla el objeto del hueso.
   */
  detachObject(boneName) {
    const attached = this.attachments.get(boneName);
    if (attached) {
      const bone = this.bones[boneName];
      if (bone) bone.remove(attached);
      this.attachments.delete(boneName);
    }
  }

  /**
   * Personaliza las texturas o materiales del modelo.
   */
  customizeMaterial(partName, materialOptions) {
    this.scene.traverse(node => {
      if (node.isMesh || node.isSkinnedMesh) {
        const name = node.name.toLowerCase();
        if (name.includes(partName.toLowerCase())) {
          if (node.material) {
            // Aplicar propiedades o colores nuevos
            if (materialOptions.color !== undefined) {
              node.material.color.set(materialOptions.color);
            }
            if (materialOptions.roughness !== undefined) {
              node.material.roughness = materialOptions.roughness;
            }
            if (materialOptions.metalness !== undefined) {
              node.material.metalness = materialOptions.metalness;
            }
            if (materialOptions.map !== undefined) {
              node.material.map = materialOptions.map;
              node.material.needsUpdate = true;
            }
          }
        }
      }
    });
  }

  /**
   * Aplica cinemática inversa básica o rotación procedimental para que la cabeza mire a un objetivo.
   */
  lookAt(targetPosition) {
    const head = this.bones.head;
    if (!head) return;

    // Calcular dirección hacia el objetivo
    const worldPos = new THREE.Vector3();
    head.getWorldPosition(worldPos);

    const dir = new THREE.Vector3().copy(targetPosition).sub(worldPos).normalize();
    
    // Rotar cabeza procedimentalmente de forma suave
    const localTarget = head.parent.worldToLocal(targetPosition.clone());
    head.lookAt(localTarget);
    
    // Restringir la rotación para evitar giros imposibles
    head.rotation.x = Math.max(-0.6, Math.min(0.6, head.rotation.x));
    head.rotation.y = Math.max(-1.0, Math.min(1.0, head.rotation.y));
    head.rotation.z = 0;
  }
}

// Exportar globalmente
window.PlayerRig = PlayerRig;

/**
 * RigController - Gestiona la jerarquía de huesos y los puntos de acoplamiento.
 */
class RigController {
  constructor(scene) {
    this.scene = scene;
    this.bones = {};
    this.attachments = new Map();
    this.mapSkeleton();
  }

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
  }

  attachObject(boneName, object, positionOffset = new THREE.Vector3(), rotationOffset = new THREE.Euler()) {
    const bone = this.bones[boneName];
    if (!bone) return false;

    this.detachObject(boneName);

    object.position.copy(positionOffset);
    object.rotation.copy(rotationOffset);

    bone.add(object);
    this.attachments.set(boneName, object);
    return true;
  }

  detachObject(boneName) {
    const attached = this.attachments.get(boneName);
    if (attached) {
      const bone = this.bones[boneName];
      if (bone) bone.remove(attached);
      this.attachments.delete(boneName);
    }
  }
}

window.RigController = RigController;

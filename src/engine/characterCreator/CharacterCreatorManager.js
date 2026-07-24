/**
 * CharacterCreatorManager - Orquestador general del editor de personajes.
 */
class CharacterCreatorManager {
  constructor(scene, camera) {
    this.face = new FaceGenerator();
    this.body = new BodyCustomizer();
    this.hair = new HairSystem();
    this.clothing = new ClothingCustomizer();
    this.equipment = new EquipmentCustomizer();
    this.identity = new PlayerIdentity();
    this.studio = new PreviewStudio(scene, camera);
  }

  customizeCharacter(humanoidPlayer, options) {
    if (!humanoidPlayer) return;

    // Rostro y cuerpo
    if (options.faceMorphs && humanoidPlayer.mesh) {
      this.face.applyMorphs(humanoidPlayer.mesh, options.faceMorphs);
    }
    if (options.height !== undefined && options.muscle !== undefined) {
      this.body.applyBodyScales(humanoidPlayer.skeleton, options.height, options.muscle);
    }

    // Cabello
    const headBone = humanoidPlayer.skeleton ? humanoidPlayer.skeleton.bones.find(b => b.name.toLowerCase().includes('head')) : null;
    if (headBone && options.hairStyle) {
      this.hair.attachHairToHead(headBone, options.hairStyle, options.hairColor || 0x221100);
    }

    // Pala en la mano derecha
    const rHandBone = humanoidPlayer.skeleton ? humanoidPlayer.skeleton.bones.find(b => b.name.toLowerCase().includes('righthand') || b.name.toLowerCase().includes('rightwrist')) : null;
    if (rHandBone && options.paddleId) {
      this.equipment.attachPaddleToHand(rHandBone, options.paddleId);
    }
  }
}

window.CharacterCreatorManager = CharacterCreatorManager;

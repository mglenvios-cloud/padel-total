/**
 * BodyCustomizer - Ajusta proporciones musculares, altura y extremidades del esqueleto.
 */
class BodyCustomizer {
  constructor() {
    this.heightScale = 1.0;
    this.muscleRatio = 1.0;
  }

  applyBodyScales(skeleton, height, muscle) {
    if (!skeleton) return;

    this.heightScale = height;
    this.muscleRatio = muscle;

    // Escalar los huesos principales (Spine, Hips, Extremidades) conservando el rig
    skeleton.bones.forEach(bone => {
      if (bone.name.toLowerCase().includes('spine') || bone.name.toLowerCase().includes('hips')) {
        bone.scale.y = height;
      }
      if (bone.name.toLowerCase().includes('arm') || bone.name.toLowerCase().includes('leg')) {
        bone.scale.set(muscle, bone.scale.y, muscle);
      }
    });

    console.log(`BodyCustomizer: Proporciones de esqueleto ajustadas (Altura: ${height}, Musculatura: ${muscle}).`);
  }
}

window.BodyCustomizer = BodyCustomizer;

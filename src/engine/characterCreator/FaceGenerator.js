/**
 * FaceGenerator - Aplica deformadores (Morph Targets/Blend Shapes) y texturas faciales.
 */
class FaceGenerator {
  constructor() {
    this.faceMorphs = {
      jawWidth: 0.0,
      noseSize: 0.0,
      eyeSpan: 0.0
    };
  }

  applyMorphs(gltfMesh, options) {
    if (!gltfMesh || !gltfMesh.morphTargetInfluences) return;

    // Supongamos mapeos de influencias indexadas en el GLB de personajes profesionales
    const influences = gltfMesh.morphTargetInfluences;
    if (options.jawWidth !== undefined) {
      this.faceMorphs.jawWidth = options.jawWidth;
      influences[0] = options.jawWidth; // Canal 0: Mandíbula
    }
    if (options.noseSize !== undefined) {
      this.faceMorphs.noseSize = options.noseSize;
      influences[1] = options.noseSize; // Canal 1: Nariz
    }
    console.log('FaceGenerator: Influencias de morph targets actualizadas.');
  }
}

window.FaceGenerator = FaceGenerator;

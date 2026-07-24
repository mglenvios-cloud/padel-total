/**
 * SkeletonLoader - Carga y gestión optimizada de modelos GLTF/GLB humanoides.
 */
class SkeletonLoader {
  constructor() {
    this.cache = new Map();
    this.loadingPromises = new Map();
    this.gltfLoader = null;
  }

  async ensureLoader() {
    if (window.THREE && window.THREE.GLTFLoader) {
      if (!this.gltfLoader) {
        this.gltfLoader = new window.THREE.GLTFLoader();
      }
      return true;
    }

    if (this.loaderPromise) return this.loaderPromise;

    this.loaderPromise = new Promise((resolve) => {
      console.log('SkeletonLoader: Cargando GLTFLoader desde CDN...');
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/three@0.147.0/examples/js/loaders/GLTFLoader.js';
      script.onload = () => {
        if (window.THREE && window.THREE.GLTFLoader) {
          this.gltfLoader = new window.THREE.GLTFLoader();
          resolve(true);
        } else {
          resolve(false);
        }
      };
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });

    return this.loaderPromise;
  }

  async loadModel(url) {
    if (this.cache.has(url)) {
      return this.cloneGLTF(this.cache.get(url));
    }

    if (this.loadingPromises.has(url)) {
      const gltf = await this.loadingPromises.get(url);
      return this.cloneGLTF(gltf);
    }

    const loadPromise = (async () => {
      const ready = await this.ensureLoader();
      if (!ready || !this.gltfLoader) {
        throw new Error('GLTFLoader no disponible');
      }

      return new Promise((resolve, reject) => {
        this.gltfLoader.load(
          url,
          (gltf) => {
            this.cache.set(url, gltf);
            resolve(gltf);
          },
          undefined,
          (error) => reject(error)
        );
      });
    })();

    this.loadingPromises.set(url, loadPromise);

    try {
      const gltf = await loadPromise;
      return this.cloneGLTF(gltf);
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  cloneGLTF(gltf) {
    const clone = {
      animations: gltf.animations,
      scene: gltf.scene.clone(true)
    };

    const skinnedMeshes = {};
    gltf.scene.traverse(node => {
      if (node.isSkinnedMesh) skinnedMeshes[node.name] = node;
    });

    const cloneBones = {};
    const cloneSkinnedMeshes = {};

    clone.scene.traverse(node => {
      if (node.isBone) cloneBones[node.name] = node;
      if (node.isSkinnedMesh) cloneSkinnedMeshes[node.name] = node;
    });

    for (let name in skinnedMeshes) {
      const originalMesh = skinnedMeshes[name];
      const clonedMesh = cloneSkinnedMeshes[name];
      if (clonedMesh) {
        const orderedCloneBones = [];
        for (let i = 0; i < originalMesh.skeleton.bones.length; i++) {
          const originalBoneName = originalMesh.skeleton.bones[i].name;
          orderedCloneBones.push(cloneBones[originalBoneName]);
        }
        clonedMesh.bind(new THREE.Skeleton(orderedCloneBones, originalMesh.skeleton.boneInverses), clonedMesh.matrixWorld);
      }
    }

    return clone;
  }
}

window.SkeletonLoader = SkeletonLoader;

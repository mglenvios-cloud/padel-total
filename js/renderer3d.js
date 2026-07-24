// ============================================================
// RENDERER3D.JS — Escena Three.js: cancha, jugadores, pelota, efectos
// Versión mejorada: jugadores humanoides, iluminación cinemática,
// cámara dinámica estilo TV, textura de cancha detallada
// ============================================================

class GameRenderer3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.frame = 0;
    this.particles = [];
    this.shakeIntensity = 0;
    this.shakeDecay = 0.92;

    // SkeletonLoader es opcional — si falla no detiene el motor
    try { this.skeletonLoader = new SkeletonLoader(); } catch(e) { this.skeletonLoader = null; console.warn('SkeletonLoader no disponible:', e.message); }

    // Inicializar WebGL renderer primero (crítico)
    this._initRenderer();
    this._initCamera();
    this._initLighting();

    // Construcción de cancha y estadio — envueltos en try/catch
    try { this._buildCourt(); } catch(e) { console.warn('_buildCourt falló:', e.message); }
    try { this._buildStadium(); } catch(e) { console.warn('_buildStadium falló:', e.message); }

    // Subsistemas AAA opcionales — encapsulados en try/catch
    try { this.characterManager = new CharacterManager(this.skeletonLoader, this.scene); } catch(e) { this.characterManager = null; console.warn('CharacterManager no disponible:', e.message); }
    try { this.broadcastManager = new BroadcastManager(this.camera); } catch(e) { this.broadcastManager = null; console.warn('BroadcastManager no disponible:', e.message); }
    try { this.graphicsSettings = new GraphicsSettings(this); } catch(e) { this.graphicsSettings = null; console.warn('GraphicsSettings no disponible:', e.message); }
    try { this.stadiumManager = new StadiumManager(this.scene, this.envMap); } catch(e) { this.stadiumManager = null; console.warn('StadiumManager no disponible:', e.message); }
  }

  // TEST VISUAL: cubo brillante en el centro de la escena
  _addTestCube() {
    const geo = new THREE.BoxGeometry(2, 2, 2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x00ff44,
      emissive: 0x00aa22,
      emissiveIntensity: 1.0,
      roughness: 0.3,
      metalness: 0.5
    });
    this._testCube = new THREE.Mesh(geo, mat);
    this._testCube.position.set(0, 1, 0);
    this._testCube.name = 'TEST_CUBE';
    this.scene.add(this._testCube);
    // Se elimina automáticamente después de 5 segundos
    setTimeout(() => {
      if (this._testCube) {
        this.scene.remove(this._testCube);
        this._testCube = null;
      }
    }, 5000);
  }

  _initRenderer() {
    let initialized = false;
    if (navigator.gpu && typeof THREE.WebGPURenderer !== 'undefined') {
      try {
        console.log("AI Graphics Studio: Initializing WebGPURenderer...");
        this.renderer = new THREE.WebGPURenderer({ canvas: this.canvas, antialias: true });
        initialized = true;
      } catch (e) {
        console.warn("WebGPURenderer failed, falling back to WebGLRenderer:", e);
      }
    }
    
    if (!initialized) {
      console.log("AI Graphics Studio: Initializing WebGLRenderer...");
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false
      });
    }

    // CORRECCIÓN: primero setPixelRatio, luego setSize con updateStyle=true
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    this.renderer.setPixelRatio(dpr);
    const W = window.innerWidth;
    const H = window.innerHeight;
    this.renderer.setSize(W, H, true);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;

    if (this.renderer.toneMapping !== undefined) {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.35;
    }

    // Fondo oscuro azul (no puro negro para distinguir si Three.js está activo)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040f2a);
    this.scene.fog = new THREE.FogExp2(0x040f2a, 0.007);

    // Generar y almacenar el mapa de entorno procedimental
    this.envMap = this._makeEnvMap();
  }

  _makeEnvMap() {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 512;
    const ctx = c.getContext('2d');
    
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#010307');
    grad.addColorStop(0.5, '#051126');
    grad.addColorStop(1, '#010307');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);
    
    // Luces de estadio y glows de color
    const colors = ['#00d4ff', '#7c3aed', '#ff6b35', '#00ff87'];
    for (let i = 0; i < 4; i++) {
      const cx = 150 + i * 240;
      const cy = 180;
      
      // Glow
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 180);
      glow.addColorStop(0, colors[i] + '44');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, cy, 180, 0, Math.PI * 2); ctx.fill();
      
      // Reflector
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(cx, cy, 25, 0, Math.PI * 2); ctx.fill();
    }
    
    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    return tex;
  }

  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(48, this.canvas.width / this.canvas.height, 0.1, 300);
    this.camera.position.set(0, 11, 18);
    this.camera.lookAt(0, 0, 0);
    this._camTarget = new THREE.Vector3(0, 11, 18);
    this._lookTarget = new THREE.Vector3(0, 0, 0);
    this._camBasePos = new THREE.Vector3(0, 11, 18);
  }

  _initLighting() {
    this.scene.add(new THREE.AmbientLight(0x0e1320, 1.4));

    const hemi = new THREE.HemisphereLight(0x3a4b6e, 0x080808, 0.7);
    this.scene.add(hemi);

    // Reflector principal para sombras súper definidas
    this.sun = new THREE.DirectionalLight(0xfff8ee, 2.2);
    this.sun.position.set(2, 22, 2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 40;
    this.sun.shadow.camera.left = -16;
    this.sun.shadow.camera.right = 16;
    this.sun.shadow.camera.top = 16;
    this.sun.shadow.camera.bottom = -16;
    this.sun.shadow.bias = -0.0005;
    this.scene.add(this.sun);
  }

  _buildCourt() {
    const courtGroup = new THREE.Group();

    // ── ALFOMBRA ROJA EXTERIOR (WPT) ───────────────────────
    const carpetAlbedo = this._makeCarpetAlbedo();
    const carpetTex = new THREE.CanvasTexture(carpetAlbedo);
    carpetTex.wrapS = carpetTex.wrapT = THREE.RepeatWrapping;
    carpetTex.repeat.set(6, 8);
    const carpetMat = new THREE.MeshStandardMaterial({
      map: carpetTex,
      roughness: 0.85,
      metalness: 0.05,
      normalMap: this._makeCarpetNormalMap(),
      normalScale: new THREE.Vector2(0.5, 0.5)
    });
    const carpet = new THREE.Mesh(new THREE.BoxGeometry(22, 0.08, 32), carpetMat);
    carpet.position.y = -0.08;
    carpet.receiveShadow = true;
    courtGroup.add(carpet);

    // ── SUELO con textura azul detallada (WPT) ──────────────
    const floorCanvas = this._makeCourtTexture();
    const floorTex = new THREE.CanvasTexture(floorCanvas);
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      normalMap: this._makeCourtNormalMap(),
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughnessMap: this._makeCourtRoughnessMap(),
      roughness: 0.85,
      metalness: 0.0,
      color: 0x0f5ad2, // Azul WPT
    });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.12, 20), floorMat);
    floor.position.y = -0.06;
    floor.receiveShadow = true;
    courtGroup.add(floor);

    // ── LÍNEAS BLANCAS ─────────────────────────────────────
    const lineMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.05,
      emissive: 0xffffff,
      emissiveIntensity: 0.08
    });
    const addLine = (w, d, x, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.019, d), lineMat);
      m.position.set(x, 0.01, z);
      m.receiveShadow = true;
      courtGroup.add(m);
    };
    // Líneas exteriores
    addLine(0.07, 20, -4.97, 0);
    addLine(0.07, 20, 4.97, 0);
    addLine(10, 0.07, 0, -9.97);
    addLine(10, 0.07, 0, 9.97);
    // Red marca en suelo
    addLine(10, 0.05, 0, 0);
    // Líneas de saque (a 6.95m de la red)
    addLine(10, 0.06, 0, -6.95);
    addLine(10, 0.06, 0, 6.95);
    // Centrales
    addLine(0.06, 13.9, 0, 0);

    // ── MATERIAL VIDRIO ──────────────────────────
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xcceeff,
      transparent: true,
      opacity: 0.24,
      roughness: 0.02,
      metalness: 0.95,
      envMap: this.envMap,
      envMapIntensity: 2.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    // Azul oscuro estructural para el marco metálico
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x081d4a,
      metalness: 0.9,
      roughness: 0.15,
      envMap: this.envMap,
      envMapIntensity: 1.5
    });

    // Vidrio laterales (3m alto)
    [-5, 5].forEach(x => {
      const g = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3, 20), glassMat);
      g.position.set(x, 1.5, 0);
      courtGroup.add(g);
    });

    // Vidrio trasero (3m)
    [-10, 10].forEach(z => {
      const g = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 0.06), glassMat);
      g.position.set(0, 1.5, z);
      courtGroup.add(g);
    });

    // ── REJA lateral y superior en color azul estructurado ──
    courtGroup.add(this._makeFence(-5, 3.5, 0, 'side'));
    courtGroup.add(this._makeFence(5, 3.5, 0, 'side'));
    courtGroup.add(this._makeFence(0, 3.5, -10, 'back'));
    courtGroup.add(this._makeFence(0, 3.5, 10, 'back'));

    // ── POSTES / MARCOS ─────────────────────────────────────
    const postGeo = new THREE.BoxGeometry(0.08, 4.1, 0.08);
    [[-5,-10],[5,-10],[-5,0],[5,0],[-5,10],[5,10]].forEach(([x,z]) => {
      const p = new THREE.Mesh(postGeo, frameMat);
      p.position.set(x, 2.05, z);
      p.castShadow = true;
      courtGroup.add(p);
    });
    // Rail superior
    const railH = new THREE.BoxGeometry(10.2, 0.06, 0.06);
    [-10, 0, 10].forEach(z => {
      [-1,1].forEach(side => {
        const r = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 20.2), frameMat);
        r.position.set(side * 5, 4.05, 0);
        courtGroup.add(r);
      });
      const rh = new THREE.Mesh(railH, frameMat);
      rh.position.set(0, 4.05, z);
      courtGroup.add(rh);
    });

    // ── RED AMARILLA DE ALTA VISIBILIDAD ───────────────────
    const netCanvas = this._makeNetCanvas();
    const netTex = new THREE.CanvasTexture(netCanvas);
    const netMat = new THREE.MeshStandardMaterial({
      map: netTex,
      transparent: true,
      side: THREE.DoubleSide,
      color: 0xffea00, // Amarillo brillante
      alphaTest: 0.1,
      roughness: 0.3,
      metalness: 0.2
    });
    const netMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 0.88), netMat);
    netMesh.position.set(0, 0.44, 0);
    netMesh.rotation.y = 0;
    courtGroup.add(netMesh);

    // Banda superior (Amarillo Neón Emisivo)
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0xffea00,
      emissive: 0xffd700,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.1
    });
    const band = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.08, 0.06), bandMat);
    band.position.set(0, 0.93, 0);
    courtGroup.add(band);

    // Postes de la red (Amarillo Metalizado)
    const postMat = new THREE.MeshStandardMaterial({
      color: 0xffea00,
      emissive: 0xffb700,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2
    });
    const postNetGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.05, 12);
    [-5.1, 5.1].forEach(x => {
      const pn = new THREE.Mesh(postNetGeo, postMat);
      pn.position.set(x, 0.525, 0);
      pn.castShadow = true;
      courtGroup.add(pn);
    });

    this.scene.add(courtGroup);
    this.courtGroup = courtGroup;
  }

  // ── TEXTURA DE CANCHA ─────────────────────────────────────
  _makeCourtTexture() {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 1024;
    const ctx = c.getContext('2d');

    // Base azul WPT
    ctx.fillStyle = '#093c90';
    ctx.fillRect(0, 0, 1024, 1024);

    // Patrón de césped sintético HD (líneas finas verticales más densas)
    for (let i = 0; i < 1024; i += 2) {
      const shade = 10 + Math.random() * 20;
      ctx.fillStyle = `rgb(${shade}, ${50 + Math.random() * 40}, ${120 + Math.random() * 65})`;
      ctx.fillRect(i, 0, 1, 1024);
    }

    // Textura granulada ultra sutil (arena de sílice)
    for (let i = 0; i < 12000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const brightness = Math.random() > 0.5 ? 255 : 0;
      ctx.fillStyle = `rgba(${brightness},${brightness},${brightness},0.04)`;
      ctx.fillRect(x, y, 1, 1);
    }

    return c;
  }

  _makeCourtNormalMap() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const ctx = c.getContext('2d');
    const imgData = ctx.createImageData(512, 512);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const nx = Math.floor(128 + (Math.random() - 0.5) * 40);
      const ny = Math.floor(128 + (Math.random() - 0.5) * 40);
      imgData.data[i] = nx;
      imgData.data[i + 1] = ny;
      imgData.data[i + 2] = 255;
      imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 16);
    return tex;
  }

  _makeCourtRoughnessMap() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const ctx = c.getContext('2d');
    const imgData = ctx.createImageData(512, 512);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const val = Math.floor(180 + Math.random() * 75);
      imgData.data[i] = val;
      imgData.data[i + 1] = val;
      imgData.data[i + 2] = val;
      imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 16);
    return tex;
  }

  _makeCarpetAlbedo() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const ctx = c.getContext('2d');
    
    // Rojo oscuro de base
    ctx.fillStyle = '#b01018';
    ctx.fillRect(0, 0, 512, 512);
    
    // Dibujar patrón de malla/lona
    ctx.strokeStyle = '#990d14';
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 4) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
    }
    return c;
  }

  _makeCarpetNormalMap() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    const imgData = ctx.createImageData(256, 256);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const nx = Math.floor(128 + (Math.random() - 0.5) * 15);
      const ny = Math.floor(128 + (Math.random() - 0.5) * 15);
      imgData.data[i] = nx;
      imgData.data[i + 1] = ny;
      imgData.data[i + 2] = 255;
      imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(24, 24);
    return tex;
  }

  _makeFence(x, y, z, type) {
    const fCanvas = document.createElement('canvas');
    fCanvas.width = 128; fCanvas.height = 32;
    const ctx = fCanvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 32);
    ctx.strokeStyle = 'rgba(160,160,160,0.9)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= 128; i += 8) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 32); ctx.stroke();
    }
    for (let j = 0; j <= 32; j += 8) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(128, j); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(fCanvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const mat = new THREE.MeshStandardMaterial({
      map: tex, transparent: true, side: THREE.DoubleSide,
      alphaMap: tex, color: 0x081d4a // Rejas en azul oscuro estructurado
    });

    let geo;
    if (type === 'side') {
      geo = new THREE.PlaneGeometry(20, 1);
      tex.repeat.set(10, 1);
    } else {
      geo = new THREE.PlaneGeometry(10, 1);
      tex.repeat.set(5, 1);
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    if (type === 'side') mesh.rotation.y = Math.PI / 2;
    return mesh;
  }

  _makeNetCanvas() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 512, 128);
    ctx.strokeStyle = 'rgba(255,234,0,0.95)';
    ctx.lineWidth = 1.8;
    // Malla diagonal para aspecto más realista
    for (let x = 0; x <= 512; x += 8) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 128); ctx.stroke();
    }
    for (let y = 0; y <= 128; y += 8) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
    }
    return c;
  }

  _buildStadium() {
    // Tribunas escalonadas con material deportivo optimizado
    const standMat = new THREE.MeshStandardMaterial({ color: 0x090e17, roughness: 0.95 });
    
    const seatGeo = new THREE.BoxGeometry(0.35, 0.18, 0.45);
    const seatMat = new THREE.MeshStandardMaterial({ 
      color: 0xd0d5dd, 
      roughness: 0.5,
      metalness: 0.15,
      envMap: this.envMap,
      envMapIntensity: 0.5
    });
    
    const crowdColors = [0x005ebb, 0xff5511, 0x11bb55, 0x7c3aed, 0x222222, 0xd02030, 0xebad00];
    const headGeo = new THREE.SphereGeometry(0.22, 6, 5);
    const bodyGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.4, 6);
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.7 });

    const seatPositions = [];
    const spectatorPositions = [];

    const addSeatAndSpectatorData = (x, y, z, rotY) => {
      seatPositions.push({ x, y: y + 0.09, z, rotY });
      if (Math.random() < 0.72) {
        spectatorPositions.push({ x, y: y + 0.18, z, rotY });
      }
    };

    // Tribunas Laterales (Izquierda y Derecha)
    [-10.8, 10.8].forEach(x => {
      const dir = Math.sign(x);
      const rotY = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      for (let step = 0; step < 3; step++) {
        const stepX = x + (dir * step * 1.5);
        const stepY = -0.5 + step * 1.1;
        const s = new THREE.Mesh(new THREE.BoxGeometry(1.4, stepY + 1.4, 30), standMat);
        s.position.set(stepX, (stepY - 0.6) / 2, 0);
        s.receiveShadow = true;
        this.scene.add(s);

        for (let sz = -12; sz <= 12; sz += 2.8) {
          addSeatAndSpectatorData(stepX, stepY, sz, rotY);
        }
      }
    });

    // Tribunas de Fondos (Norte y Sur)
    [-16.8, 16.8].forEach(z => {
      const dir = Math.sign(z);
      const rotY = dir > 0 ? Math.PI : 0;
      for (let step = 0; step < 2; step++) {
        const stepZ = z + (dir * step * 1.5);
        const stepY = -0.5 + step * 1.1;
        const s = new THREE.Mesh(new THREE.BoxGeometry(18, stepY + 1.4, 1.4), standMat);
        s.position.set(0, (stepY - 0.6) / 2, stepZ);
        s.receiveShadow = true;
        this.scene.add(s);

        for (let sx = -7; sx <= 7; sx += 2.8) {
          addSeatAndSpectatorData(sx, stepY, stepZ, rotY);
        }
      }
    });

    // Instanciar Asientos
    const seatMesh = new THREE.InstancedMesh(seatGeo, seatMat, seatPositions.length);
    seatMesh.castShadow = true;
    seatMesh.receiveShadow = true;
    const dummy = new THREE.Object3D();
    seatPositions.forEach((pos, idx) => {
      dummy.position.set(pos.x, pos.y, pos.z);
      dummy.rotation.set(0, pos.rotY, 0);
      dummy.updateMatrix();
      seatMesh.setMatrixAt(idx, dummy.matrix);
    });
    this.scene.add(seatMesh);

    // Instanciar Cabezas de Espectadores
    const headMesh = new THREE.InstancedMesh(headGeo, skinMat, spectatorPositions.length);
    headMesh.castShadow = true;
    this.scene.add(headMesh);

    // Instanciar Torso/Camisetas de Espectadores
    const bodyMat = new THREE.MeshStandardMaterial({ roughness: 0.8 });
    const bodyMesh = new THREE.InstancedMesh(bodyGeo, bodyMat, spectatorPositions.length);
    bodyMesh.castShadow = true;
    
    spectatorPositions.forEach((pos, idx) => {
      // Cabeza
      dummy.position.set(pos.x, pos.y + 0.38, pos.z);
      dummy.rotation.set(0, pos.rotY, 0);
      dummy.updateMatrix();
      headMesh.setMatrixAt(idx, dummy.matrix);

      // Torso
      dummy.position.set(pos.x, pos.y + 0.1, pos.z);
      dummy.rotation.set(0, pos.rotY, 0);
      dummy.updateMatrix();
      bodyMesh.setMatrixAt(idx, dummy.matrix);

      // Color de camiseta
      const shirtColor = new THREE.Color(crowdColors[Math.floor(Math.random() * crowdColors.length)]);
      bodyMesh.setColorAt(idx, shirtColor);
    });
    
    this.scene.add(bodyMesh);

    // Guardar referencias para animaciones y reactividad
    this.spectatorPositions = spectatorPositions;
    this.headMesh = headMesh;
    this.bodyMesh = bodyMesh;
    this.animDummy = dummy;

    // ── BANNERS DEL WORLD PADEL TOUR EN LA ALFOMBRA ROJA ──
    const wptLogoTex = this._makeWPTLogoTexture();
    const bannerMat = new THREE.MeshStandardMaterial({ map: wptLogoTex, roughness: 0.6 });
    const bannerGeo = new THREE.PlaneGeometry(4, 2);
    
    [ -7.5, 7.5 ].forEach(z => {
      const banner = new THREE.Mesh(bannerGeo, bannerMat);
      banner.position.set(0, -0.015, z);
      banner.rotation.x = -Math.PI / 2;
      if (z > 0) banner.rotation.z = Math.PI;
      this.scene.add(banner);
    });

    // ── INSCRIPCIÓN GIGANTE EN PARED DE GRADA DERECHA ─────
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5, 30), standMat);
    rightWall.position.set(15.2, 1.5, 0);
    this.scene.add(rightWall);

    const wallTextMat = new THREE.MeshStandardMaterial({ map: this._makeWallTextTexture(), roughness: 0.7 });
    const wallText = new THREE.Mesh(new THREE.PlaneGeometry(12, 3), wallTextMat);
    wallText.position.set(15.1, 2.5, 0);
    wallText.rotation.y = -Math.PI / 2;
    this.scene.add(wallText);

    // ── ACCESORIOS DE LA CANCHA ────────────────────────────
    // 1. Silla del árbitro (Blanca)
    const ax = -5.4, az = -0.5;
    const chairFrameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    
    this.scene.add(this._createCylinderBetweenPoints(new THREE.Vector3(ax-0.15, 0, az-0.15), new THREE.Vector3(ax-0.05, 1.6, az-0.05), 0.02, chairFrameMat));
    this.scene.add(this._createCylinderBetweenPoints(new THREE.Vector3(ax+0.15, 0, az-0.15), new THREE.Vector3(ax+0.05, 1.6, az-0.05), 0.02, chairFrameMat));
    this.scene.add(this._createCylinderBetweenPoints(new THREE.Vector3(ax-0.15, 0, az+0.15), new THREE.Vector3(ax-0.05, 1.6, az+0.05), 0.02, chairFrameMat));
    this.scene.add(this._createCylinderBetweenPoints(new THREE.Vector3(ax+0.15, 0, az+0.15), new THREE.Vector3(ax+0.05, 1.6, az+0.05), 0.02, chairFrameMat));
    
    const refereeSeat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), seatMat);
    refereeSeat.position.set(ax, 1.8, az);
    this.scene.add(refereeSeat);

    // Árbitro sentado
    const refGroup = new THREE.Group();
    refGroup.position.set(ax, 2.0, az);
    const refTorso = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.35, 0.2), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 }));
    refTorso.position.y = 0.175;
    refGroup.add(refTorso);
    const refHead = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.6 }));
    refHead.position.y = 0.42;
    refGroup.add(refHead);
    this.scene.add(refGroup);
    this.refereeHead = refHead;
    this.refereeGroup = refGroup;

    // 2. Sofás de jugadores
    [-2.2, 2.2].forEach(sz => {
      const sofa = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 1.4), seatMat);
      sofa.position.set(-5.8, 0.175, sz);
      this.scene.add(sofa);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 1.4), seatMat);
      back.position.set(-6.01, 0.45, sz);
      this.scene.add(back);
    });

    // 3. Mesa de Control
    const table = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.72, 2.8), standMat);
    table.position.set(5.8, 0.36, 0);
    this.scene.add(table);
    for (let mz = -0.9; mz <= 0.9; mz += 0.9) {
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.7, 0.35), seatMat);
      chair.position.set(6.25, 0.35, mz);
      this.scene.add(chair);
    }

    // ── 4 POSTES DE LUZ CURVOS CON ENFOQUE DIRECTO ──────────
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.4, metalness: 0.7 });
    const lightPositions = [
      { lx: -5.15, lz: -4.0 },
      { lx: 5.15, lz: -4.0 },
      { lx: -5.15, lz: 4.0 },
      { lx: 5.15, lz: 4.0 }
    ];
    lightPositions.forEach(({ lx, lz }) => {
      this._buildCurvedLightPost(lx, lz, frameMat, seatMat);
    });
  }

  _buildCurvedLightPost(lx, lz, frameMat, seatMat) {
    const postGroup = new THREE.Group();
    const flipX = Math.sign(lx);
    const flipZ = Math.sign(lz);

    const p0 = new THREE.Vector3(lx, 0, lz);
    const p1 = new THREE.Vector3(lx, 3.8, lz);
    const p2 = new THREE.Vector3(lx - 0.7 * flipX, 5.0, lz);
    const p3 = new THREE.Vector3(lx - 1.1 * flipX, 5.4, lz + 0.3 * flipZ);

    // Segmentos tubulares
    postGroup.add(this._createCylinderBetweenPoints(p0, p1, 0.08, frameMat));
    postGroup.add(this._createCylinderBetweenPoints(p1, p2, 0.07, frameMat));
    postGroup.add(this._createCylinderBetweenPoints(p2, p3, 0.05, frameMat));

    // Cabezal
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.35), frameMat);
    head.position.copy(p3);
    head.rotation.set(0.15 * flipZ, -0.25 * flipX, 0);
    postGroup.add(head);

    // 3 Bombillas emisivas
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const bulbGeo = new THREE.SphereGeometry(0.05, 6, 5);
    for (let offset = -0.2; offset <= 0.2; offset += 0.2) {
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(p3.x + offset * flipX, p3.y - 0.06, p3.z + offset * 0.1 * flipZ);
      postGroup.add(bulb);
    }

    // Foco de luz físico
    const spot = new THREE.SpotLight(0xfff5ea, 6.0, 32, Math.PI / 4.5, 0.4, 1.0);
    spot.position.copy(p3);
    spot.position.y -= 0.1;
    spot.castShadow = true;
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.bias = -0.001;
    spot.target.position.set(0, 0, 0);
    
    // Cono volumétrico de luz sutil
    const coneGeo = new THREE.ConeGeometry(2.8, 12, 16, 1, true);
    coneGeo.translate(0, -6, 0);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfff5ea,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const lightCone = new THREE.Mesh(coneGeo, coneMat);
    lightCone.position.copy(spot.position);
    lightCone.lookAt(new THREE.Vector3(0, 0, 0));
    lightCone.rotateX(Math.PI / 2);
    
    this.scene.add(lightCone);
    this.scene.add(spot);
    this.scene.add(spot.target);
    this.scene.add(postGroup);
  }

  _createCylinderBetweenPoints(p1, p2, radius, mat) {
    const direction = new THREE.Vector3().subVectors(p2, p1);
    const dist = direction.length();
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    
    const geo = new THREE.CylinderGeometry(radius, radius, dist, 8);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    mesh.castShadow = true;
    return mesh;
  }

  _makeWPTLogoTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const ctx = c.getContext('2d');
    
    // Fondo rojo
    ctx.fillStyle = '#cc1122';
    ctx.fillRect(0, 0, 512, 256);
    
    // Borde blanco
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 12;
    ctx.strokeRect(15, 15, 482, 226);
    
    // Silueta de jugador
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(100, 128, 22, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(90, 160);
    ctx.lineTo(130, 165);
    ctx.lineTo(120, 220);
    ctx.lineTo(80, 220);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(110, 150);
    ctx.lineTo(150, 100);
    ctx.lineTo(165, 110);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(175, 90, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Texto
    ctx.font = 'bold 36px Rajdhani, Outfit, sans-serif';
    ctx.fillText('WORLD PADEL', 220, 110);
    ctx.fillText('TOUR', 220, 165);
    
    return new THREE.CanvasTexture(c);
  }

  _makeWallTextTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#0e1828';
    ctx.fillRect(0, 0, 512, 128);
    
    ctx.fillStyle = '#a0a8b5';
    ctx.font = '600 44px Rajdhani, Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('World Padel Tour', 256, 75);
    
    return new THREE.CanvasTexture(c);
  }

  _makeShirtTexture(colorHex) {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const ctx = c.getContext('2d');
    
    const colorStr = '#' + colorHex.toString(16).padStart(6, '0');
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, 128, 128);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(128, 40); ctx.lineTo(128, 60); ctx.lineTo(0, 20); ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.moveTo(0, 80); ctx.lineTo(128, 110); ctx.lineTo(128, 128); ctx.lineTo(0, 98); ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(35, 45, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 10px Rajdhani, Outfit, sans-serif';
    ctx.fillText('EVO 27', 65, 50);
    
    return c;
  }

  // ═══════════════════════════════════════════════════════════
  // JUGADORES HUMANOIDES
  // ═══════════════════════════════════════════════════════════
  createPlayerMesh(color, name, isHuman) {
    const gender = (name === 'Maya') ? 'female' : 'male';
    const id = this.scene.children.filter(c => c.userData && c.userData.playerObj).length;
    
    const playerConfig = {
      id: id,
      team: (name === 'Maya' || isHuman) ? 0 : 1,
      isHuman: isHuman,
      color: color,
      name: name,
      gender: gender,
      x: 0, z: 0
    };

    const player = this.characterManager.createCharacter(playerConfig);
    const group = player.getMesh();

    // Sombra proyectada plana en el suelo
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.35, roughness: 1, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.005;
    group.add(shadow);

    if (isHuman) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.45, 0.03, 8, 28),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9, transparent: true, opacity: 0.6 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.03;
      group.add(ring);
      group.userData.ring = ring;

      const arrow = new THREE.Mesh(
        new THREE.CylinderGeometry(0, 0.08, 0.16, 6),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7, transparent: true, opacity: 0.7 })
      );
      arrow.position.y = 1.95;
      arrow.rotation.x = Math.PI;
      group.add(arrow);
      group.userData.arrow = arrow;
    }

    group.userData.name = name;
    group.userData.isHuman = isHuman;
    group.userData.swingPhase = 0;
    group.castShadow = true;

    this.scene.add(group);
    return group;
  }

  // Textura de la pala con agujeros
  _makePaddleTexture(color) {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);

    // Agujeros circulares
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 5; col++) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.arc(8 + col * 12, 8 + row * 10, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return new THREE.CanvasTexture(c);
  }

  // ═══════════════════════════════════════════════════════════
  // PELOTA
  // ═══════════════════════════════════════════════════════════
  createBallMesh() {
    const group = new THREE.Group();

    // Pelota amarillo-verde con textura de fieltro
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xccdd20,
      roughness: 0.85,
      metalness: 0.0,
      emissive: 0x445500,
      emissiveIntensity: 0.15,
    });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), ballMat);
    ball.castShadow = true;
    group.add(ball);

    // Línea de la pelota (costura)
    const seamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.008, 4, 20), seamMat);
    seam.rotation.x = Math.PI / 3;
    group.add(seam);

    // Glow sutil
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffee55, transparent: true, opacity: 0.08, side: THREE.BackSide })
    );
    group.add(halo);
    group.userData.halo = halo;

    // Sombra proyectada en el suelo
    this.ballShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.14, 12),
      new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false })
    );
    this.ballShadow.rotation.x = -Math.PI / 2;
    this.ballShadow.position.y = 0.003;
    this.scene.add(this.ballShadow);

    // Trail
    this.ballTrail = [];
    for (let i = 0; i < 14; i++) {
      const t = new THREE.Mesh(
        new THREE.SphereGeometry(0.05 * ((i + 1) / 14), 6, 4),
        new THREE.MeshStandardMaterial({ color: 0xffdd33, transparent: true, opacity: 0, emissive: 0xffdd33, emissiveIntensity: 0.4 })
      );
      this.scene.add(t);
      this.ballTrail.push(t);
    }

    this.scene.add(group);
    return group;
  }

  // ═══════════════════════════════════════════════════════════
  // PARTÍCULAS 3D
  // ═══════════════════════════════════════════════════════════
  addParticles3D(x, y, z, color, count = 8, power = 1) {
    const geo = new THREE.SphereGeometry(0.05, 4, 3);
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8, transparent: true, opacity: 1 });
      const p = new THREE.Mesh(geo, mat);
      p.position.set(x, y, z);
      const angle = Math.random() * Math.PI * 2;
      const elevation = Math.random() * Math.PI - Math.PI / 2;
      const speed = 0.06 + Math.random() * 0.12 * power;
      p.userData = {
        vx: Math.cos(elevation) * Math.cos(angle) * speed,
        vy: Math.abs(Math.sin(elevation)) * speed + 0.03,
        vz: Math.cos(elevation) * Math.sin(angle) * speed,
        life: 1, decay: 0.035 + Math.random() * 0.035
      };
      this.scene.add(p);
      this.particles.push(p);
    }
  }

  _updateParticles() {
    this.particles = this.particles.filter(p => {
      p.userData.vy -= 0.003;
      p.position.x += p.userData.vx;
      p.position.y += p.userData.vy;
      p.position.z += p.userData.vz;
      p.userData.life -= p.userData.decay;
      p.material.opacity = p.userData.life;
      const s = p.userData.life * 0.8 + 0.2;
      p.scale.set(s, s, s);
      if (p.userData.life <= 0) { this.scene.remove(p); return false; }
      return true;
    });
  }

  // ═══════════════════════════════════════════════════════════
  // TRAIL DE LA PELOTA
  // ═══════════════════════════════════════════════════════════
  updateBallTrail(ballPos, speed) {
    this.ballTrail.forEach((t, i) => {
      t.position.copy(ballPos);
      t.material.opacity = (i / this.ballTrail.length) * Math.min(speed / 10, 0.5);
    });
    // Sombra
    this.ballShadow.position.set(ballPos.x, 0.003, ballPos.z);
    const h = ballPos.y;
    const s = Math.max(0.08, 1 - h * 0.06);
    this.ballShadow.scale.set(s, 1, s);
    this.ballShadow.material.opacity = Math.max(0.04, 0.5 * s);
  }

  // ═══════════════════════════════════════════════════════════
  // CAMERA SHAKE (impactos fuertes)
  // ═══════════════════════════════════════════════════════════
  triggerShake(intensity = 0.3) {
    this.shakeIntensity = Math.min(this.shakeIntensity + intensity, 0.6);
  }

  // ═══════════════════════════════════════════════════════════
  updateCamera(ballPos, dt, playState = 'rally', shotType = 'drive', players = null, ballSpeed = 0) {
    if (this.broadcastManager) {
      this.broadcastManager.update(dt, ballPos, players, playState, ballSpeed, this.frame);
      
      // Vibración por Impactos (Camera Shake)
      if (this.shakeIntensity > 0.01) {
        this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
        this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity * 0.5;
        this.shakeIntensity *= this.shakeDecay;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ANIMACIÓN DE JUGADORES HUMANOIDES
  // ═══════════════════════════════════════════════════════════
  animatePlayer(group, frame, isSwinging, ballPos, playerObj) {
    const dt = 0.016;

    // Detección de velocidad y desplazamiento
    const prevX = group.userData.lastX !== undefined ? group.userData.lastX : group.position.x;
    const prevZ = group.userData.lastZ !== undefined ? group.userData.lastZ : group.position.z;
    const dx = group.position.x - prevX;
    const dz = group.position.z - prevZ;
    const distMoved = Math.sqrt(dx * dx + dz * dz) / dt;

    group.userData.lastX = group.position.x;
    group.userData.lastZ = group.position.z;

    if (group.userData.playerObj) {
      const velocity = new THREE.Vector3(dx / dt, 0, dz / dt);
      group.userData.playerObj.update(dt, velocity, ballPos, this.camera.position);
      
      // Manejar animaciones específicas de golpeo
      if (isSwinging) {
        if (ballPos && ballPos.y > 2.2) group.userData.playerObj.playAnimation('Smash');
        else if (ballPos && ballPos.y > 1.4) group.userData.playerObj.playAnimation('Bandeja');
        else if (group.position.z * (ballPos ? (ballPos.z - group.position.z) : 1) < 0) group.userData.playerObj.playAnimation('Forehand');
        else group.userData.playerObj.playAnimation('Backhand');
      }

      if (group.userData.playerObj.glbLoaded) {
        return;
      }
    }

    // 1. Clasificación del Estado de Animación (Animation State Machine)
    let state = 'idle';
    if (distMoved > 7.0) state = 'sprint';
    else if (distMoved > 3.0) state = 'run';
    else if (distMoved > 0.3) state = 'walk';

    // Ready Position si el balón está cerca
    const distToBall = ballPos ? group.position.distanceTo(ballPos) : 999;
    if (state === 'idle' && distToBall < 4.0) {
      state = 'ready';
    }

    // Golpes (Anticipación / Preparación deportiva)
    if (isSwinging) {
      if (ballPos && ballPos.y > 2.2) state = 'smash';
      else if (ballPos && ballPos.y > 1.4) state = 'bandeja';
      else if (group.position.z * (ballPos ? (ballPos.z - group.position.z) : 1) < 0) state = 'forehand';
      else state = 'backhand';
    }

    group.userData.animState = state;

    // 2. Blend Trees & Procedural Rotations
    let targetLegSpeed = 0.18;
    let targetLegRot = 0;
    let targetBodyY = 0;
    let targetTorsoRotY = 0;
    let targetTorsoRotX = 0;

    if (state === 'ready') {
      targetLegRot = 0.15;
      targetBodyY = -0.08;
      targetLegSpeed = 0.05;
    } else if (state === 'walk') {
      targetLegRot = Math.sin(frame * 0.15) * 0.28;
      targetLegSpeed = 0.15;
    } else if (state === 'run') {
      targetLegRot = Math.sin(frame * 0.2) * 0.45;
      targetBodyY = -0.05;
      targetLegSpeed = 0.2;
    } else if (state === 'sprint') {
      targetLegRot = Math.sin(frame * 0.24) * 0.6;
      targetBodyY = -0.1;
      targetLegSpeed = 0.24;
      targetTorsoRotX = 0.15;
    } else if (state === 'smash') {
      targetLegRot = 0.3;
      targetBodyY = 0.2;
      targetTorsoRotX = -0.2;
      targetTorsoRotY = 0.4;
    } else if (state === 'bandeja') {
      targetLegRot = 0.1;
      targetBodyY = -0.04;
      targetTorsoRotY = -0.5;
    }

    // Deslizar al frenar (Slide)
    const prevSpeed = group.userData.lastSpeed !== undefined ? group.userData.lastSpeed : 0;
    group.userData.lastSpeed = distMoved;
    if (prevSpeed - distMoved > 4.5 && distMoved < 1.0) {
      targetBodyY = -0.15;
      targetLegRot = 0.5;
      this.addParticles3D(group.position.x, 0.05, group.position.z, 0xffffff, 4, 0.4);
    }

    // Lerps
    group.userData.leftLegRot = THREE.MathUtils.lerp(group.userData.leftLegRot || 0, targetLegRot, 0.2);
    group.userData.rightLegRot = THREE.MathUtils.lerp(group.userData.rightLegRot || 0, -targetLegRot, 0.2);
    group.userData.bodyY = THREE.MathUtils.lerp(group.userData.bodyY || 0, targetBodyY, 0.15);
    group.userData.torsoRotX = THREE.MathUtils.lerp(group.userData.torsoRotX || 0, targetTorsoRotX, 0.15);
    group.userData.torsoRotY = THREE.MathUtils.lerp(group.userData.torsoRotY || 0, targetTorsoRotY, 0.15);

    const leftLeg = group.userData.leftLeg;
    const rightLeg = group.userData.rightLeg;
    const leftKnee = group.userData.leftKnee;
    const rightKnee = group.userData.rightKnee;
    const rightElbow = group.userData.rightElbow;
    const torso = group.children[0];

    if (leftLeg && rightLeg) {
      leftLeg.rotation.x = group.userData.leftLegRot;
      rightLeg.rotation.x = group.userData.rightLegRot;

      // Flexión biomecánica de rodillas al dar la zancada
      if (leftKnee) {
        const leftKneeFlex = group.userData.leftLegRot > 0 ? group.userData.leftLegRot * 1.3 : 0.05;
        leftKnee.rotation.x = THREE.MathUtils.lerp(leftKnee.rotation.x || 0, leftKneeFlex, 0.25);
      }
      if (rightKnee) {
        const rightKneeFlex = group.userData.rightLegRot > 0 ? group.userData.rightLegRot * 1.3 : 0.05;
        rightKnee.rotation.x = THREE.MathUtils.lerp(rightKnee.rotation.x || 0, rightKneeFlex, 0.25);
      }
    }

    if (rightElbow) {
      const swingT = Math.sin(group.userData.swingPhase || 0);
      const targetElbowFlex = isSwinging ? -0.8 * swingT : -0.15;
      rightElbow.rotation.x = THREE.MathUtils.lerp(rightElbow.rotation.x || 0, targetElbowFlex, 0.25);
    }

    if (torso) {
      torso.rotation.x = group.userData.torsoRotX;
      torso.rotation.y = group.userData.torsoRotY;
      torso.position.y = group.userData.bodyY;
    }

    // 3. Inverse Kinematics (IK)
    // Cabeza sigue el balón
    if (ballPos && group.children[1]) {
      const head = group.children[1];
      const relBall = new THREE.Vector3().copy(ballPos).sub(group.position);
      const targetHeadRotY = Math.atan2(relBall.x, relBall.z);
      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetHeadRotY - group.rotation.y, 0.15);
    }

    // Brazo dominante alinea pala
    const rightArmPivot = group.userData.rightArmPivot;
    if (rightArmPivot) {
      if (isSwinging) {
        group.userData.swingPhase = Math.min((group.userData.swingPhase || 0) + 0.16, Math.PI);
        const swingT = Math.sin(group.userData.swingPhase);
        
        let swingX = -1.2 * swingT;
        let swingZ = -0.6 * swingT;
        
        if (state === 'smash') {
          swingX = -1.6 * swingT;
          swingZ = 0.2 * swingT;
        } else if (state === 'bandeja') {
          swingX = -0.9 * swingT;
          swingZ = -0.8 * swingT;
        }
        
        group.userData.rightArmPivotRotX = THREE.MathUtils.lerp(group.userData.rightArmPivotRotX || 0, swingX, 0.3);
        group.userData.rightArmPivotRotZ = THREE.MathUtils.lerp(group.userData.rightArmPivotRotZ || 0, swingZ, 0.3);
      } else {
        group.userData.swingPhase = 0;
        group.userData.rightArmPivotRotX = THREE.MathUtils.lerp(group.userData.rightArmPivotRotX || 0, 0, 0.2);
        group.userData.rightArmPivotRotZ = THREE.MathUtils.lerp(group.userData.rightArmPivotRotZ || 0, 0, 0.2);
      }
      rightArmPivot.rotation.x = group.userData.rightArmPivotRotX;
      rightArmPivot.rotation.z = group.userData.rightArmPivotRotZ;
    }

    // Rotar jugador para que mire hacia la red
    const lookZ = group.position.z > 0 ? -1 : 1;
    const targetRotY = Math.atan2(0, lookZ);
    group.rotation.y += (targetRotY - group.rotation.y) * 0.15;
  }

  setQualityLevel(level) {
    this.quality = level;
    console.log("AI Graphics Studio: Graphic quality set to " + level.toUpperCase());
    
    const hasShadows = (level !== 'bajo');
    const shadowSize = (level === 'ultra') ? 2048 : (level === 'alto') ? 1024 : 512;
    
    this.sun.castShadow = hasShadows;
    if (hasShadows && this.sun.shadow.map) {
      this.sun.shadow.mapSize.set(shadowSize, shadowSize);
      this.sun.shadow.map.setSize(shadowSize, shadowSize);
    }
    
    // Alternar visibilidad de conos de luz volumétrica según calidad
    this.scene.traverse(node => {
      if (node.isMesh && node.material && node.material.blending === THREE.AdditiveBlending) {
        node.visible = (level === 'ultra' || level === 'alto');
      }
    });
  }

  _setupProfiler() {
    this.lastProfilerTime = performance.now();
    this.fpsCount = 0;
    this.fps = 0;
    
    const overlay = document.createElement('div');
    overlay.id = 'aaa-profiler';
    overlay.style.cssText = 'position:fixed;top:10px;left:10px;z-index:9999;background:rgba(5,10,20,0.85);border:1px solid #00d4ff;color:#00d4ff;padding:12px;border-radius:8px;font-family:monospace;font-size:11px;pointer-events:all;box-shadow:0 0 15px rgba(0,212,255,0.15);backdrop-filter:blur(6px);min-width:180px;';
    
    overlay.innerHTML = `
      <div style="font-weight:bold;margin-bottom:6px;border-bottom:1px solid #00d4ff33;padding-bottom:4px;letter-spacing:1px;">⚡ AAA ENGINE PROFILER</div>
      <div>FPS: <span id="prof-fps" style="color:#00ff87">--</span></div>
      <div>Render Time: <span id="prof-time" style="color:#ffd700">-- ms</span></div>
      <div>Draw Calls: <span id="prof-draws">--</span></div>
      <div>Triangles: <span id="prof-tris">--</span></div>
      <div style="margin-top:6px;border-top:1px solid #00d4ff33;padding-top:4px;">
        <select id="prof-quality" style="background:#091224;color:#00d4ff;border:1px solid #00d4ff66;font-size:10px;border-radius:4px;width:100%;padding:2px;cursor:pointer;">
          <option value="low">Calidad: Baja</option>
          <option value="medium">Calidad: Media</option>
          <option value="high">Calidad: Alta</option>
          <option value="ultra" selected>Calidad: Ultra (WebGPU)</option>
        </select>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    const select = document.getElementById('prof-quality');
    select.value = this.quality === 'ultra' ? 'ultra' : this.quality === 'alto' ? 'high' : this.quality === 'medium' ? 'medium' : 'low';
    select.addEventListener('change', (e) => {
      const level = e.target.value === 'high' ? 'alto' : e.target.value;
      this.setQualityLevel(level);
    });
  }

  updateProfiler(dt) {
    if (!this.lastProfilerTime) this._setupProfiler();
    
    this.fpsCount++;
    const now = performance.now();
    if (now - this.lastProfilerTime >= 1000) {
      this.fps = this.fpsCount;
      this.fpsCount = 0;
      this.lastProfilerTime = now;
      
      const fpsEl = document.getElementById('prof-fps');
      const timeEl = document.getElementById('prof-time');
      const drawsEl = document.getElementById('prof-draws');
      const trisEl = document.getElementById('prof-tris');
      
      if (fpsEl) {
        fpsEl.textContent = this.fps;
        fpsEl.style.color = this.fps >= 100 ? '#00ff87' : this.fps >= 60 ? '#ffd700' : '#ff3366';
      }
      
      if (timeEl && this.renderer.info) {
        timeEl.textContent = (dt * 1000).toFixed(1) + ' ms';
      }
      
      if (drawsEl && this.renderer.info) {
        drawsEl.textContent = this.renderer.info.render.calls;
      }
      
      if (trisEl && this.renderer.info) {
        trisEl.textContent = this.renderer.info.render.triangles.toLocaleString();
      }
    }
  }

  // ── SISTEMA DE CLIMA DINÁMICO (Lluvia) ───────────────────────
  setWeather(type) {
    this.weatherType = type;
    if (type === 'lluvia') {
      console.log("AI Graphics Studio: Activando lluvia dinámica...");
      const rainGeo = new THREE.BufferGeometry();
      const rainCount = 800;
      const positions = new Float32Array(rainCount * 3);
      for (let i = 0; i < rainCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 30;
        positions[i + 1] = Math.random() * 15;
        positions[i + 2] = (Math.random() - 0.5) * 40;
      }
      rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const rainMat = new THREE.PointsMaterial({
        color: 0x88ccff,
        size: 0.08,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });
      this.rainParticles = new THREE.Points(rainGeo, rainMat);
      this.scene.add(this.rainParticles);
      
      // Mojar la cancha para aumentar reflectividad
      if (this.courtGroup) {
        this.courtGroup.traverse(node => {
          if (node.isMesh && node.material && node.name !== 'line') {
            node.material.roughness = Math.max(0.1, node.material.roughness * 0.4);
            node.material.metalness = Math.min(0.9, node.material.metalness + 0.3);
          }
        });
      }
    } else {
      if (this.rainParticles) {
        this.scene.remove(this.rainParticles);
        this.rainParticles = null;
      }
    }
  }

  _updateWeather() {
    if (this.weatherType === 'lluvia' && this.rainParticles) {
      const positions = this.rainParticles.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 0.28;
        if (positions[i] < 0) {
          positions[i] = 15;
          if (Math.random() < 0.05) {
            this.addParticles3D(positions[i-1], 0.05, positions[i+1], 0x88ccff, 3, 0.2);
          }
        }
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }
  }

  resize(W, H) {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(W, H, true);
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
  }

  render(ballPos, players, ballSpeed, frame, dt) {
    this.frame++;

    if (this.frame === 1) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      try { this.setQualityLevel(isMobile ? 'medio' : 'alto'); } catch(e) {}
      try { this._setupProfiler(); } catch(e) {}
    }

    // Actualizar clima y partículas
    try { this._updateWeather(); } catch(e) {}
    if (ballPos) try { this.updateBallTrail(ballPos, ballSpeed); } catch(e) {}
    try { this._updateParticles(); } catch(e) {}

    // Actualizar sistema modular de personajes
    if (this.characterManager) {
      try { this.characterManager.update(dt, ballPos, this.camera.position); } catch(e) {}
    }

    // Actualizar sistema modular de estadio
    if (this.stadiumManager) {
      try { this.stadiumManager.update(dt, this.frame); } catch(e) {}
    }

    // Animaciones de jugadores (con paso de ballPos y objeto jugador)
    players.forEach(p => {
      if (p.mesh) try { this.animatePlayer(p.mesh, frame, p.isSwinging, ballPos, p); } catch(e) {}
    });

    // Árbitro head-tracking
    if (this.refereeHead && ballPos) {
      try {
        const relBall = new THREE.Vector3().copy(ballPos).sub(this.refereeGroup.position);
        this.refereeHead.rotation.y = THREE.MathUtils.lerp(this.refereeHead.rotation.y, Math.atan2(relBall.x, relBall.z), 0.15);
      } catch(e) {}
    }

    // Animar espectadores instanciados (celebración/movimiento cada 4 frames para 60 FPS)
    if (this.headMesh && this.bodyMesh && this.spectatorPositions && frame % 4 === 0) {
      try {
        const crowdTime = frame * 0.08;
        const dummy = this.animDummy;
        this.spectatorPositions.forEach((pos, idx) => {
          const offset = Math.sin(crowdTime + idx * 0.5) * 0.06;
          dummy.position.set(pos.x, pos.y + 0.38 + Math.max(0, offset), pos.z);
          dummy.rotation.set(0, pos.rotY, 0);
          dummy.updateMatrix();
          this.headMesh.setMatrixAt(idx, dummy.matrix);
          dummy.position.set(pos.x, pos.y + 0.1 + Math.max(0, offset), pos.z);
          dummy.rotation.set(0, pos.rotY, 0);
          dummy.updateMatrix();
          this.bodyMesh.setMatrixAt(idx, dummy.matrix);
        });
        this.headMesh.instanceMatrix.needsUpdate = true;
        this.bodyMesh.instanceMatrix.needsUpdate = true;
      } catch(e) {}
    }

    // Deducir estado de la jugada para el Director IA de Cámara
    let playState = 'rally';
    let shotType = 'drive';
    players.forEach(p => {
      if (p.mesh && p.mesh.userData.animState) {
        if (p.mesh.userData.animState === 'smash' || p.mesh.userData.animState === 'bandeja' || p.mesh.userData.animState === 'lob') {
          shotType = p.mesh.userData.animState;
        }
      }
    });
    if (!this.ballMesh || !this.ballMesh.visible || ballSpeed < 1.0) {
      playState = 'serve';
    }

    if (ballPos) try { this.updateCamera(ballPos, dt, playState, shotType, players, ballSpeed); } catch(e) {}

    // Actualizar el perfilador
    try { this.updateProfiler(dt); } catch(e) {}

    // Renderizado principal — siempre se ejecuta
    this.renderer.render(this.scene, this.camera);
  }
}

window.GameRenderer3D = GameRenderer3D;

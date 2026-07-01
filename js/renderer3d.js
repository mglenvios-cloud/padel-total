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
    this._initRenderer();
    this._initCamera();
    this._initLighting();
    this._buildCourt();
    this._buildStadium();
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x03070f);
    this.scene.fog = new THREE.FogExp2(0x03070f, 0.008);
  }

  _initCamera() {
    // Cámara más baja y cercana — estilo TV deportiva
    this.camera = new THREE.PerspectiveCamera(48, this.canvas.width / this.canvas.height, 0.1, 300);
    this.camera.position.set(0, 11, 18);
    this.camera.lookAt(0, 0, 0);
    this._camTarget = new THREE.Vector3(0, 11, 18);
    this._lookTarget = new THREE.Vector3(0, 0, 0);
    this._camBasePos = new THREE.Vector3(0, 11, 18);
  }

  _initLighting() {
    // Ambiente oscuro de estadio cerrado
    this.scene.add(new THREE.AmbientLight(0x111622, 1.2));

    // Luz hemisférica muy suave
    const hemi = new THREE.HemisphereLight(0x334466, 0x111111, 0.6);
    this.scene.add(hemi);

    // Sol direccional para sombras principales (como un reflector cenital)
    this.sun = new THREE.DirectionalLight(0xfff5e6, 1.8);
    this.sun.position.set(2, 20, 2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 40;
    this.sun.shadow.camera.left = -15;
    this.sun.shadow.camera.right = 15;
    this.sun.shadow.camera.top = 15;
    this.sun.shadow.camera.bottom = -15;
    this.sun.shadow.bias = -0.001;
    this.scene.add(this.sun);
  }

  _buildCourt() {
    const courtGroup = new THREE.Group();

    // ── ALFOMBRA ROJA EXTERIOR (WPT) ───────────────────────
    const carpetMat = new THREE.MeshStandardMaterial({
      color: 0xcc1122, // Rojo brillante
      roughness: 0.9,
      metalness: 0.05
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
      roughness: 0.82,
      metalness: 0,
      color: 0x0f5ad2, // Azul WPT
    });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.12, 20), floorMat);
    floor.position.y = -0.06;
    floor.receiveShadow = true;
    courtGroup.add(floor);

    // ── LÍNEAS BLANCAS ─────────────────────────────────────
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, emissive: 0xffffff, emissiveIntensity: 0.05 });
    const addLine = (w, d, x, z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.018, d), lineMat);
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
      color: 0xaaddff,
      transparent: true,
      opacity: 0.18,
      roughness: 0.05,
      metalness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    // Azul oscuro estructural para el marco metálico
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x081d4a, metalness: 0.8, roughness: 0.3 });

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

    // ── RED mejorada ─────────────────────────────────────
    const netCanvas = this._makeNetCanvas();
    const netTex = new THREE.CanvasTexture(netCanvas);
    const netMat = new THREE.MeshStandardMaterial({
      map: netTex, transparent: true, side: THREE.DoubleSide,
      color: 0xffffff, alphaTest: 0.1
    });
    const netMesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 0.88), netMat);
    netMesh.position.set(0, 0.44, 0);
    netMesh.rotation.y = 0;
    courtGroup.add(netMesh);

    // Banda superior
    const band = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.08, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.1 }));
    band.position.set(0, 0.93, 0);
    courtGroup.add(band);

    // Postes de la red
    const postNetGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.05, 8);
    [-5.1, 5.1].forEach(x => {
      const pn = new THREE.Mesh(postNetGeo, frameMat);
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
    c.width = 512; c.height = 512;
    const ctx = c.getContext('2d');

    // Base azul WPT
    ctx.fillStyle = '#0a42a0';
    ctx.fillRect(0, 0, 512, 512);

    // Patrón de césped sintético (líneas finas verticales)
    for (let i = 0; i < 512; i += 2) {
      const shade = 10 + Math.random() * 15;
      ctx.fillStyle = `rgb(${shade}, ${60 + Math.random() * 30}, ${140 + Math.random() * 45})`;
      ctx.fillRect(i, 0, 1, 512);
    }

    // Textura granulada sutil
    for (let i = 0; i < 3500; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const brightness = Math.random() > 0.5 ? 255 : 0;
      ctx.fillStyle = `rgba(${brightness},${brightness},${brightness},0.035)`;
      ctx.fillRect(x, y, 1, 1);
    }

    return c;
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
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.5;
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
    // ── TRIBUNAS ESCALONADAS DEL ESTADIO ───────────────────
    const standMat = new THREE.MeshStandardMaterial({ color: 0x0e1828, roughness: 0.95 });
    const seatMat = new THREE.MeshStandardMaterial({ color: 0xe0e2e5, roughness: 0.6 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x081d4a, metalness: 0.8, roughness: 0.3 });
    const seatGeo = new THREE.BoxGeometry(0.35, 0.18, 0.45);
    
    // Público: esferas con colores variados
    const crowdColors = [0x005ebb, 0xff5511, 0x11bb55, 0x7c3aed, 0x222222, 0xd02030, 0xebad00];
    const crowdGeo = new THREE.SphereGeometry(0.24, 6, 5);
    const bodyGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.4, 6);

    const addSeatAndSpectator = (x, y, z, rotY) => {
      // Asiento blanco
      const seat = new THREE.Mesh(seatGeo, seatMat);
      seat.position.set(x, y + 0.09, z);
      seat.rotation.y = rotY;
      seat.castShadow = true;
      this.scene.add(seat);

      // 70% de probabilidad de tener un espectador
      if (Math.random() < 0.70) {
        const color = crowdColors[Math.floor(Math.random() * crowdColors.length)];
        const shirtMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.7 });

        const person = new THREE.Group();
        const head = new THREE.Mesh(crowdGeo, skinMat);
        head.position.y = 0.38;
        person.add(head);

        const body = new THREE.Mesh(bodyGeo, shirtMat);
        body.position.y = 0.1;
        person.add(body);

        person.position.set(x, y + 0.18, z);
        person.rotation.y = rotY;
        this.scene.add(person);
      }
    };

    // Tribunas Laterales (Izquierda y Derecha, a lo largo de Y)
    [-10.8, 10.8].forEach(x => {
      const dir = Math.sign(x);
      const rotY = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      
      for (let step = 0; step < 4; step++) {
        const stepX = x + (dir * step * 1.2);
        const stepY = -0.5 + step * 0.9;
        
        // Bloque de Grada
        const s = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, stepY + 1.2, 30),
          standMat
        );
        s.position.set(stepX, (stepY - 0.6) / 2, 0);
        s.receiveShadow = true;
        this.scene.add(s);

        // Añadir asientos en este escalón
        for (let sz = -14; sz <= 14; sz += 0.95) {
          addSeatAndSpectator(stepX, stepY, sz, rotY);
        }
      }
    });

    // Tribunas de Fondos (Norte y Sur, a lo largo de X)
    [-16.8, 16.8].forEach(z => {
      const dir = Math.sign(z);
      const rotY = dir > 0 ? Math.PI : 0;
      
      for (let step = 0; step < 3; step++) {
        const stepZ = z + (dir * step * 1.2);
        const stepY = -0.5 + step * 0.9;
        
        // Bloque de Grada
        const s = new THREE.Mesh(
          new THREE.BoxGeometry(18, stepY + 1.2, 1.2),
          standMat
        );
        s.position.set(0, (stepY - 0.6) / 2, stepZ);
        s.receiveShadow = true;
        this.scene.add(s);

        // Añadir asientos en este escalón
        for (let sx = -8; sx <= 8; sx += 0.95) {
          addSeatAndSpectator(sx, stepY, stepZ, rotY);
        }
      }
    });

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
    const spot = new THREE.SpotLight(0xfff5ea, 5.0, 30, Math.PI / 4, 0.5, 1.0);
    spot.position.copy(p3);
    spot.position.y -= 0.1;
    spot.castShadow = true;
    spot.shadow.mapSize.set(512, 512);
    spot.shadow.bias = -0.002;
    spot.target.position.set(0, 0, 0);
    
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

  // ═══════════════════════════════════════════════════════════
  // JUGADORES HUMANOIDES
  // ═══════════════════════════════════════════════════════════
  createPlayerMesh(color, name, isHuman) {
    const group = new THREE.Group();

    const skinColor = 0xd4a574;
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7, metalness: 0.0 });
    const shirtMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05 });
    const shortsMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5 });

    // ── TORSO (camiseta) ──
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.28), shirtMat);
    torso.position.y = 1.1;
    torso.castShadow = true;
    group.add(torso);

    // ── CABEZA ──
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), skinMat);
    head.position.y = 1.6;
    head.castShadow = true;
    group.add(head);

    // Pelo
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.9 });
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.21, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
    hair.position.y = 1.64;
    group.add(hair);

    // ── SHORTS ──
    const shorts = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.27), shortsMat);
    shorts.position.y = 0.72;
    group.add(shorts);

    // ── PIERNAS ──
    const legGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.45, 6);
    const leftLeg = new THREE.Mesh(legGeo, skinMat);
    leftLeg.position.set(-0.12, 0.38, 0);
    group.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, skinMat);
    rightLeg.position.set(0.12, 0.38, 0);
    group.add(rightLeg);
    group.userData.leftLeg = leftLeg;
    group.userData.rightLeg = rightLeg;

    // ── ZAPATILLAS ──
    const shoeGeo = new THREE.BoxGeometry(0.1, 0.06, 0.18);
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(-0.12, 0.13, 0.03);
    group.add(leftShoe);
    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0.12, 0.13, 0.03);
    group.add(rightShoe);
    group.userData.leftShoe = leftShoe;
    group.userData.rightShoe = rightShoe;

    // ── BRAZOS ──
    const armGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.4, 6);

    // Brazo izquierdo (libre)
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-0.32, 1.05, 0);
    leftArm.rotation.z = 0.3;
    group.add(leftArm);
    group.userData.leftArm = leftArm;

    // Brazo derecho (pala) — pivote
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.28, 1.2, 0);
    group.add(rightArmPivot);

    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(0.05, -0.2, 0);
    rightArm.rotation.z = -0.3;
    rightArmPivot.add(rightArm);

    // ── PALA de pádel ──
    const paddleGroup = new THREE.Group();
    paddleGroup.position.set(0.1, -0.42, 0);

    // Mango
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.03, 0.22, 6),
      new THREE.MeshStandardMaterial({ color: 0x4a2800, roughness: 0.8 })
    );
    paddleGroup.add(handle);

    // Cabeza de pala (forma de lágrima/elipse)
    const paddleHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.14, 0.03, 12),
      new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.15, side: THREE.DoubleSide })
    );
    paddleHead.rotation.x = Math.PI / 2;
    paddleHead.position.y = -0.16;
    paddleGroup.add(paddleHead);

    // Agujeros en la pala (textura)
    const paddleTex = this._makePaddleTexture(color);
    const paddleFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.28, 0.26),
      new THREE.MeshStandardMaterial({
        map: paddleTex, transparent: true, side: THREE.DoubleSide,
        roughness: 0.5, metalness: 0.1
      })
    );
    paddleFace.position.y = -0.16;
    paddleFace.position.z = 0.02;
    paddleGroup.add(paddleFace);

    rightArmPivot.add(paddleGroup);
    group.userData.rightArmPivot = rightArmPivot;
    group.userData.paddleGroup = paddleGroup;

    // ── SOMBRA en suelo ──
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.45, 16),
      new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.35, roughness: 1, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.005;
    group.add(shadow);

    // ── AURA para jugador humano ──
    if (isHuman) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.5, 0.04, 8, 28),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.9, transparent: true, opacity: 0.6 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.03;
      group.add(ring);
      group.userData.ring = ring;

      // Flecha indicadora sobre la cabeza
      const arrow = new THREE.Mesh(
        new THREE.CylinderGeometry(0, 0.1, 0.18, 6),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7, transparent: true, opacity: 0.7 })
      );
      arrow.position.y = 2.0;
      arrow.rotation.x = Math.PI; // Apuntando hacia abajo
      group.add(arrow);
      group.userData.arrow = arrow;
    }

    // Nombre en userData
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
  // CÁMARA DINÁMICA — estilo TV deportiva
  // ═══════════════════════════════════════════════════════════
  updateCamera(ballPos, dt) {
    // Seguir la pelota sutilmente en X e Y
    const targetX = ballPos.x * 0.2;
    const targetY = 11 + ballPos.y * 0.15;
    const targetZ = 18;

    this._camBasePos.set(targetX, targetY, targetZ);
    this._camTarget.lerp(this._camBasePos, dt * 2.0);

    // Aplicar shake
    if (this.shakeIntensity > 0.01) {
      this._camTarget.x += (Math.random() - 0.5) * this.shakeIntensity;
      this._camTarget.y += (Math.random() - 0.5) * this.shakeIntensity * 0.5;
      this.shakeIntensity *= this.shakeDecay;
    }

    this.camera.position.copy(this._camTarget);

    // Look target: sigue la pelota más sutilmente
    const lookX = ballPos.x * 0.15;
    const lookY = ballPos.y * 0.2;
    const lookZ = ballPos.z * 0.1;
    this._lookTarget.lerp(new THREE.Vector3(lookX, lookY, lookZ), dt * 2.5);
    this.camera.lookAt(this._lookTarget);
  }

  // ═══════════════════════════════════════════════════════════
  // ANIMACIÓN DE JUGADORES HUMANOIDES
  // ═══════════════════════════════════════════════════════════
  animatePlayer(group, frame, isSwinging) {
    const speed = 0.1;

    // Bobbing sutil al caminar
    const bob = Math.sin(frame * 0.12 + group.position.x * 3) * 0.04;
    if (group.children[1]) group.children[1].position.y = 1.6 + bob; // Cabeza

    // Piernas: animación de caminar
    const leftLeg = group.userData.leftLeg;
    const rightLeg = group.userData.rightLeg;
    const leftShoe = group.userData.leftShoe;
    const rightShoe = group.userData.rightShoe;
    if (leftLeg && rightLeg) {
      const walkCycle = Math.sin(frame * 0.15 + group.position.x) * 0.25;
      leftLeg.rotation.x = walkCycle;
      rightLeg.rotation.x = -walkCycle;
      if (leftShoe) leftShoe.position.z = 0.03 + Math.sin(frame * 0.15 + group.position.x) * 0.04;
      if (rightShoe) rightShoe.position.z = 0.03 - Math.sin(frame * 0.15 + group.position.x) * 0.04;
    }

    // Brazo izquierdo: balanceo natural
    const leftArm = group.userData.leftArm;
    if (leftArm) {
      leftArm.rotation.x = Math.sin(frame * 0.15 + group.position.x + Math.PI) * 0.2;
    }

    // Brazo derecho: swing de pala
    const rightArmPivot = group.userData.rightArmPivot;
    if (rightArmPivot) {
      if (isSwinging) {
        // Animación de golpe: brazo va hacia adelante y vuelve
        group.userData.swingPhase = Math.min((group.userData.swingPhase || 0) + 0.12, Math.PI);
        const swingT = Math.sin(group.userData.swingPhase);
        rightArmPivot.rotation.x = -0.8 * swingT; // Hacia adelante
        rightArmPivot.rotation.z = -0.4 * swingT;  // Hacia afuera
      } else {
        // Posición de espera
        group.userData.swingPhase = 0;
        rightArmPivot.rotation.x = rightArmPivot.rotation.x * 0.9; // Suavizar vuelta
        rightArmPivot.rotation.z = rightArmPivot.rotation.z * 0.9;
      }
    }

    // Aura del jugador humano
    if (group.userData.ring) {
      group.userData.ring.material.opacity = 0.4 + Math.sin(frame * 0.06) * 0.2;
    }
    if (group.userData.arrow) {
      group.userData.arrow.position.y = 1.95 + Math.sin(frame * 0.08) * 0.08;
      group.userData.arrow.material.opacity = 0.5 + Math.sin(frame * 0.06) * 0.2;
    }

    // Rotar jugador para que mire hacia la red
    const lookZ = group.position.z > 0 ? -1 : 1;
    const targetRotY = Math.atan2(0, lookZ);
    group.rotation.y += (targetRotY - group.rotation.y) * 0.1;
  }

  resize(W, H) {
    this.renderer.setSize(W, H, false);
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
  }

  render(ballPos, players, ballSpeed, frame, dt) {
    this.frame++;

    // Trail y sombra
    if (ballPos) this.updateBallTrail(ballPos, ballSpeed);

    // Partículas
    this._updateParticles();

    // Animaciones de jugadores
    players.forEach(p => {
      if (p.mesh) this.animatePlayer(p.mesh, frame, p.isSwinging);
    });

    // Cámara dinámica
    if (ballPos) this.updateCamera(ballPos, dt);

    // Render
    this.renderer.render(this.scene, this.camera);
  }
}

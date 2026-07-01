// ============================================================
// PHYSICS3D.JS — Motor de física Cannon-es para el juego 3D
// ============================================================
// Coordenadas: X (-5 a +5), Y (altura), Z (-10 a +10)
// Net en Z=0, jugador humano en Z>0, rivales en Z<0

class PhysicsWorld3D {
  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.allowSleep = true;

    // Materiales físicos
    this.ballMat  = new CANNON.Material('ball');
    this.floorMat = new CANNON.Material('floor');
    this.glassMat = new CANNON.Material('glass');
    this.fenceMat = new CANNON.Material('fence');
    this.netMat   = new CANNON.Material('net');

    // Contactos (bounciness) — ajustados para realismo
    this._addContact(this.ballMat, this.floorMat, 0.52, 0.45);  // bote en suelo — menos rebote
    this._addContact(this.ballMat, this.glassMat, 0.60, 0.12);  // vidrio — más absorción
    this._addContact(this.ballMat, this.fenceMat, 0.40, 0.30);  // reja — amortigua mucho
    this._addContact(this.ballMat, this.netMat,   0.08, 0.85);  // red casi no rebota

    this._buildStaticBodies();
    this._createBall();

    // Eventos de colisión
    this.onBounce = null;
    this.onWall   = null;
    this.onNet    = null;
    this.lastBounceTime = 0;
    this.ballBody.addEventListener('collide', (e) => this._onCollide(e));
  }

  _addContact(matA, matB, restitution, friction) {
    const cm = new CANNON.ContactMaterial(matA, matB, { restitution, friction });
    this.world.addContactMaterial(cm);
  }

  _buildStaticBodies() {
    const add = (shape, pos, mat) => {
      const body = new CANNON.Body({ mass: 0, shape, material: mat });
      body.position.set(...pos);
      this.world.addBody(body);
      return body;
    };

    // Suelo
    const floor = new CANNON.Body({ mass: 0, material: this.floorMat });
    floor.addShape(new CANNON.Plane());
    floor.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.world.addBody(floor);

    // Paredes laterales (vidrio) — X = ±5, alto 4m
    add(new CANNON.Box(new CANNON.Vec3(0.05, 2, 10)), [-5, 2, 0], this.glassMat);
    add(new CANNON.Box(new CANNON.Vec3(0.05, 2, 10)), [5, 2, 0], this.glassMat);

    // Paredes traseras (vidrio) — Z = ±10
    add(new CANNON.Box(new CANNON.Vec3(5, 2, 0.05)), [0, 2, -10], this.glassMat);
    add(new CANNON.Box(new CANNON.Vec3(5, 2, 0.05)), [0, 2, 10], this.glassMat);

    // Paredes reja (parte alta) — Y: 3-4m
    add(new CANNON.Box(new CANNON.Vec3(0.05, 0.5, 10)), [-5, 3.5, 0], this.fenceMat);
    add(new CANNON.Box(new CANNON.Vec3(0.05, 0.5, 10)), [5, 3.5, 0], this.fenceMat);
    add(new CANNON.Box(new CANNON.Vec3(5, 0.5, 0.05)), [0, 3.5, -10], this.fenceMat);
    add(new CANNON.Box(new CANNON.Vec3(5, 0.5, 0.05)), [0, 3.5, 10], this.fenceMat);

    // Red — Z=0, 0.92m de alto, 10m ancho, 0.05m grosor
    this.netBody = add(new CANNON.Box(new CANNON.Vec3(5, 0.46, 0.03)), [0, 0.46, 0], this.netMat);
    this.netBody.userData = { isNet: true };

    // Techo invisible (globos no salen)
    add(new CANNON.Box(new CANNON.Vec3(6, 0.05, 12)), [0, 10, 0], this.fenceMat);
  }

  _createBall() {
    const shape = new CANNON.Sphere(0.11);
    this.ballBody = new CANNON.Body({
      mass: 0.057,
      shape,
      material: this.ballMat,
      linearDamping: 0.08,  // resistencia del aire — mayor para más realismo
      angularDamping: 0.10,
    });
    this.ballBody.allowSleep = false;
    this.ballBody.position.set(0, 5, 0);
    this.ballBody.velocity.set(0, 0, 0);
    this.world.addBody(this.ballBody);
    this.ballBody.userData = { bounces: 0, lastHitTeam: -1, inPlay: false };
  }

  _onCollide(event) {
    const contact = event.contact;
    const impactVelocity = contact.getImpactVelocityAlongNormal();

    if (Math.abs(impactVelocity) < 0.5) return;

    const otherBody = event.body;
    const now = performance.now();
    if (now - this.lastBounceTime < 50) return; // Evitar eventos duplicados
    this.lastBounceTime = now;

    const pos = this.ballBody.position;

    // Detectar tipo de colisión
    if (otherBody.material === this.floorMat) {
      this.ballBody.userData.bounces++;
      if (this.onBounce) this.onBounce({ x: pos.x, y: 0, z: pos.z, bounces: this.ballBody.userData.bounces });
    } else if (otherBody.material === this.glassMat || otherBody.material === this.fenceMat) {
      if (this.onWall) this.onWall({ x: pos.x, y: pos.y, z: pos.z });
    } else if (otherBody === this.netBody) {
      if (this.onNet) this.onNet({ x: pos.x, y: pos.y, z: pos.z });
    }
  }

  // ── SAQUE ─────────────────────────────────────────────────
  serve(fromX, fromZ, toX, toZ, power, servingTeam) {
    const body = this.ballBody;
    body.userData.bounces = 0;
    body.userData.inPlay = true;
    body.userData.lastHitTeam = servingTeam;

    // Posición inicial (botando en el suelo, área de saque)
    const startY = 0.5;
    body.position.set(fromX, startY, fromZ);
    body.velocity.set(0, 0, 0);
    body.angularVelocity.set(0, 0, 0);
    body.wakeUp();

    // Calcular velocidad hacia el objetivo con parábola — velocidades reducidas
    const dx = toX - fromX;
    const dz = toZ - fromZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const speed = 5 + power * 3.5;
    const t = dist / (speed * 0.85);
    const vy = (3.5 - startY + 0.5 * 9.82 * t * t) / t;

    body.velocity.set((dx / dist) * speed, vy, (dz / dist) * speed);
    body.angularVelocity.set((Math.random() - 0.5) * 1.5, Math.random() * 0.5, (Math.random() - 0.5) * 1.5);
  }

  // ── GOLPE ─────────────────────────────────────────────────
  hit(playerPos, shotType, power, toX, toZ, hittingTeam) {
    const body = this.ballBody;
    body.userData.bounces = 0;
    body.userData.lastHitTeam = hittingTeam;
    body.userData.inPlay = true;

    const dx = toX - playerPos.x;
    const dz = toZ - playerPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz) || 1;

    const shotConfig = {
      drive:   { speed: 6 + power * 4,   vy: 2.0, spin: 0.4 },
      backhand:{ speed: 5.5 + power * 3.5, vy: 2.2, spin: -0.3 },
      volley:  { speed: 6.5 + power * 3,  vy: 1.2, spin: 0.15 },
      lob:     { speed: 3.5 + power * 2.5, vy: 5.5, spin: -1.0 },
      bandeja: { speed: 5 + power * 3,    vy: 3.2, spin: 0.7 },
      smash:   { speed: 8 + power * 5,    vy: -0.5, spin: 1.5 },
    };
    const cfg = shotConfig[shotType] || shotConfig.drive;

    body.velocity.set(
      (dx / dist) * cfg.speed,
      cfg.vy + power * 2,
      (dz / dist) * cfg.speed
    );
    body.angularVelocity.set(cfg.spin * (Math.random() - 0.5) * 4, cfg.spin * 3, cfg.spin * (Math.random() - 0.5) * 4);
    body.wakeUp();
  }

  // ── PELOTA FUERA ─────────────────────────────────────────
  isBallDead() {
    const p = this.ballBody.position;
    return p.x < -6 || p.x > 6 || p.z < -12 || p.z > 12 || p.y < -2;
  }

  // ── QUIÉN TIENE QUE GOLPEAR ───────────────────────────────
  getBallSide() {
    return this.ballBody.position.z > 0 ? 1 : 0; // 1 = jugador, 0 = rival
  }

  // ── DISTANCE CHECK ─────────────────────────────────────────
  canPlayerHit(playerPos) {
    const b = this.ballBody.position;
    const dx = b.x - playerPos.x;
    const dy = b.y - playerPos.y;
    const dz = b.z - playerPos.z;
    const dist = Math.sqrt(dx*dx + dy*dy*0.3 + dz*dz);
    return dist < 1.0 && b.y < 2.5;
  }

  step(dt) {
    this.world.step(1 / 60, dt, 3);
  }

  reset() {
    const body = this.ballBody;
    body.position.set(0, 5, 5);
    body.velocity.set(0, 0, 0);
    body.angularVelocity.set(0, 0, 0);
    body.userData.bounces = 0;
    body.userData.inPlay = false;
  }
}

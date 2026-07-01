// ============================================================
// CONTROLS.JS — Teclado + Touch para el jugador humano
// ============================================================

class InputController {
  constructor() {
    this.keys = {};
    this.touch = { active: false, x: 0, y: 0, startX: 0, startY: 0 };
    this.shotKey = null;
    this.shotCharged = 0; // 0-1
    this.isCharging = false;
    this.moveVector = { x: 0, y: 0 };
    
    // Configuración para mandos (PS5 DualSense / Xbox / Genéricos)
    this.gamepadIndex = null;
    this.gamepadMove = { x: 0, y: 0 };
    
    this._setupKeyboard();
    this._setupTouch();
    this._setupGamepadEvents();
  }

  _setupKeyboard() {
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;

      // Iniciar carga del golpe
      if (!this.isCharging) {
        if (['KeyA','KeyS','KeyW','KeyQ','KeyE','KeyR','Space'].includes(e.code)) {
          this.isCharging = true;
          this.shotKey = e.code;
          this.shotCharged = 0;
        }
      }
      e.preventDefault();
    });

    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
      if (e.code === this.shotKey) {
        this.isCharging = false;
      }
      e.preventDefault();
    });
  }

  _setupTouch() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;

    let moveJoystick = null;
    let shotTouch = null;

    canvas.addEventListener('touchstart', e => {
      Array.from(e.changedTouches).forEach(t => {
        const x = t.clientX / canvas.clientWidth;
        if (x < 0.5 && !moveJoystick) {
          moveJoystick = { id: t.identifier, startX: t.clientX, startY: t.clientY };
          this.touch.active = true;
          this.touch.startX = t.clientX;
          this.touch.startY = t.clientY;
        } else if (x >= 0.5 && !shotTouch) {
          shotTouch = { id: t.identifier };
          this.isCharging = true;
          this.shotKey = 'Touch';
          this.shotCharged = 0;
        }
      });
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
      Array.from(e.changedTouches).forEach(t => {
        if (moveJoystick && t.identifier === moveJoystick.id) {
          const dx = t.clientX - moveJoystick.startX;
          const dy = t.clientY - moveJoystick.startY;
          const len = Math.hypot(dx, dy);
          const maxRadius = 60;
          if (len > 2) {
            this.moveVector.x = (dx / Math.max(len, maxRadius)) * Math.min(len / maxRadius, 1);
            this.moveVector.y = (dy / Math.max(len, maxRadius)) * Math.min(len / maxRadius, 1);
          }
        }
      });
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('touchend', e => {
      Array.from(e.changedTouches).forEach(t => {
        if (moveJoystick && t.identifier === moveJoystick.id) {
          moveJoystick = null;
          this.moveVector = { x: 0, y: 0 };
          this.touch.active = false;
        }
        if (shotTouch && t.identifier === shotTouch.id) {
          shotTouch = null;
          this.isCharging = false;
        }
      });
    });
  }

  /** Obtiene la dirección de movimiento (normalizada -1 a 1) */
  getMovement() {
    let mx = 0, my = 0;
    if (this.keys['ArrowLeft']  || this.keys['KeyJ']) mx -= 1;
    if (this.keys['ArrowRight'] || this.keys['KeyL']) mx += 1;
    if (this.keys['ArrowUp']    || this.keys['KeyI']) my -= 1;
    if (this.keys['ArrowDown']  || this.keys['KeyK']) my += 1;
    // También WASD para mover (cuando no hay teclas de golpe)
    if (this.keys['KeyA'] && !this.isCharging) mx -= 1;
    if (this.keys['KeyD'] && !this.isCharging) mx += 1;
    if (this.keys['KeyW'] && !this.isCharging) my -= 1;
    if (this.keys['KeyS'] && !this.isCharging) my += 1;

    // Touch joystick
    if (this.touch.active) {
      mx += this.moveVector.x;
      my += this.moveVector.y;
    }

    // Gamepad Joystick (PS5 / Xbox)
    if (this.gamepadMove) {
      mx += this.gamepadMove.x;
      my += this.gamepadMove.y;
    }

    const len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }
    return { x: mx, y: my };
  }

  /** Tipo de golpe según tecla presionada */
  getShotType() {
    const key = this.shotKey;
    if (key === 'KeyA' || key === 'Touch') return 'drive';
    if (key === 'KeyS') return 'backhand';
    if (key === 'KeyW') return 'volley';
    if (key === 'KeyQ') return 'lob';
    if (key === 'KeyE') return 'bandeja';
    if (key === 'KeyR') return 'vibora';
    if (key === 'Space') return 'smash';
    return 'drive';
  }

  /** Actualizar carga del poder (llamado cada frame) y procesar Gamepad */
  update() {
    this._updateGamepad();
    if (this.isCharging) {
      this.shotCharged = Math.min(1, this.shotCharged + 0.033);
    }
  }

  /** ¿Hay golpe listo para ejecutar? */
  getReleaseShot() {
    if (!this.isCharging && this.shotCharged > 0.05) {
      const power = this.shotCharged;
      this.shotCharged = 0;
      return power;
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════
  // CONFIGURACIÓN DE MANDOS (PLAYSTATION 5 DUALSENSE / XBOX)
  // ═══════════════════════════════════════════════════════════
  _setupGamepadEvents() {
    window.addEventListener('gamepadconnected', e => {
      console.log("Mando conectado:", e.gamepad.id, "en índice:", e.gamepad.index);
      this.gamepadIndex = e.gamepad.index;
    });

    window.addEventListener('gamepaddisconnected', e => {
      console.log("Mando desconectado del índice:", e.gamepad.index);
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadIndex = null;
        this.gamepadMove = { x: 0, y: 0 };
      }
    });
  }

  _updateGamepad() {
    // Si no se ha guardado el índice, buscar el primer mando disponible
    if (this.gamepadIndex === null) {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          this.gamepadIndex = i;
          break;
        }
      }
    }

    if (this.gamepadIndex === null) return;

    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[this.gamepadIndex];
    if (!gp) return;

    // 1. Joystick Izquierdo (Mover)
    // Eje 0 = Horizontal (X), Eje 1 = Vertical (Y)
    const deadzone = 0.18;
    let axisX = gp.axes[0] || 0;
    let axisY = gp.axes[1] || 0;

    if (Math.abs(axisX) < deadzone) axisX = 0;
    if (Math.abs(axisY) < deadzone) axisY = 0;

    this.gamepadMove = { x: axisX, y: axisY };

    // 2. Mapeo de botones de golpe para PS5 DualSense (Standard layout)
    // Botón 0: Cruz (X) -> Drive (Derecha) / Tecla A
    // Botón 1: Círculo (O) -> Revés / Tecla S
    // Botón 2: Cuadrado (▢) -> Volea / Tecla W
    // Botón 3: Triángulo (△) -> Globo / Tecla Q
    // Botón 4: L1 -> Bandeja / Tecla E
    // Botón 5: R1 -> Víbora / Tecla R
    // Botón 7: R2 (Gatillo derecho) -> Remate (Smash) / Barra Espaciadora
    const buttonsMap = [
      { btn: 0, code: 'KeyA' },
      { btn: 1, code: 'KeyS' },
      { btn: 2, code: 'KeyW' },
      { btn: 3, code: 'KeyQ' },
      { btn: 4, code: 'KeyE' },
      { btn: 5, code: 'KeyR' },
      { btn: 7, code: 'Space' }
    ];

    buttonsMap.forEach(m => {
      const button = gp.buttons[m.btn];
      const isPressed = button ? button.pressed : false;

      // Sincronizar con this.keys para detectar pulsación en saque y lógica de juego
      this.keys[m.code] = isPressed;

      if (isPressed) {
        if (!this.isCharging) {
          this.isCharging = true;
          this.shotKey = m.code;
          this.shotCharged = 0;
        }
      } else if (this.isCharging && this.shotKey === m.code) {
        this.isCharging = false;
      }
    });
  }
}

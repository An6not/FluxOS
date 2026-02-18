const Player = {
    pos: new THREE.Vector3(0, 5, 0),
    vel: new THREE.Vector3(0, 0, 0),
    rot: { x: 0, y: 0 },
    input: { f: 0, s: 0 },
    isGrounded: false,
    height: 1.7,
    radius: 0.3,
    lookTouchId: null,

    init() {
        this.setupJoystick();
        this.setupLook();
    },

    setupJoystick() {
        const base = document.getElementById('joy-base');
        const stick = document.getElementById('joy-stick');
        base.addEventListener('touchstart', (e) => e.preventDefault(), {passive: false});
        base.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const t = e.targetTouches[0];
            const r = base.getBoundingClientRect();
            const dx = t.clientX - (r.left + r.width/2), dy = t.clientY - (r.top + r.height/2);
            const d = Math.min(40, Math.sqrt(dx*dx + dy*dy)), a = Math.atan2(dy, dx);
            stick.style.transform = `translate(${Math.cos(a)*d}px, ${Math.sin(a)*d}px)`;
            this.input.f = -Math.sin(a + Math.PI/2) * (d/40);
            this.input.s = Math.cos(a + Math.PI/2) * (d/40);
        }, {passive: false});
        base.addEventListener('touchend', () => { stick.style.transform = ''; this.input.f = 0; this.input.s = 0; });
    },

    setupLook() {
        let lx, ly;
        window.addEventListener('touchstart', (e) => {
            for(let t of e.changedTouches) {
                if(t.clientX > window.innerWidth / 2 && this.lookTouchId === null) {
                    this.lookTouchId = t.identifier; lx = t.clientX; ly = t.clientY;
                }
            }
        });
        window.addEventListener('touchmove', (e) => {
            for(let t of e.changedTouches) {
                if(t.identifier === this.lookTouchId) {
                    this.rot.y -= (t.clientX - lx) * 0.007;
                    this.rot.x = Math.max(-1.5, Math.min(1.5, this.rot.x - (t.clientY - ly) * 0.007));
                    lx = t.clientX; ly = t.clientY;
                }
            }
        }, {passive: false});
        window.addEventListener('touchend', (e) => {
            for(let t of e.changedTouches) if(t.identifier === this.lookTouchId) this.lookTouchId = null;
        });
    },

    // ПРОВЕРКА КОЛЛИЗИЙ (С ПОЛОМ И БЛОКАМИ)
    check(p, world) {
        // 1. Коллизия с бесконечным полом
        if (p.y <= 0) return true;

        // 2. Коллизия с установленными блоками
        const gridX = Math.round(p.x);
        const gridY = Math.floor(p.y);
        const gridZ = Math.round(p.z);
        
        // Проверяем ноги и голову
        if (world.has(`${gridX},${gridY},${gridZ}`)) return true;
        if (world.has(`${gridX},${Math.floor(p.y + 1.6)},${gridZ}`)) return true;

        return false;
    },

    update(world) {
        if (Main.isInMenu) return;

        this.vel.y -= 0.015; // Гравитация
        
        // Y-движение
        let nextY = this.pos.y + this.vel.y;
        if (!this.check({ x: this.pos.x, y: nextY, z: this.pos.z }, world)) {
            this.pos.y = nextY;
            this.isGrounded = false;
        } else {
            if (this.vel.y < 0) {
                this.isGrounded = true;
                this.pos.y = Math.max(0, this.pos.y); // Не даем упасть ниже пола
            }
            this.vel.y = 0;
        }

        // XZ-движение (ходьба)
        const speed = 0.12;
        const dx = (this.input.f * Math.sin(this.rot.y) + this.input.s * Math.cos(this.rot.y)) * speed;
        const dz = (this.input.f * Math.cos(this.rot.y) - this.input.s * Math.sin(this.rot.y)) * speed;

        if (!this.check({ x: this.pos.x + dx, y: this.pos.y, z: this.pos.z }, world)) this.pos.x += dx;
        if (!this.check({ x: this.pos.x, y: this.pos.y, z: this.pos.z + dz }, world)) this.pos.z += dz;
    }
};

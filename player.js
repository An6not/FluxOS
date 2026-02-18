const Player = {
    pos: new THREE.Vector3(0, 15, 0),
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
            const cx = r.left + r.width/2;
            const cy = r.top + r.height/2;
            const dx = t.clientX - cx;
            const dy = t.clientY - cy;
            const d = Math.min(40, Math.sqrt(dx*dx + dy*dy));
            const a = Math.atan2(dy, dx);

            stick.style.transform = `translate(${Math.cos(a)*d}px, ${Math.sin(a)*d}px)`;
            this.input.f = -Math.sin(a + Math.PI/2) * (d/40);
            this.input.s = Math.cos(a + Math.PI/2) * (d/40);
        }, {passive: false});

        base.addEventListener('touchend', () => {
            stick.style.transform = '';
            this.input.f = 0; this.input.s = 0;
        });
    },

    setupLook() {
        let lx, ly;
        window.addEventListener('touchstart', (e) => {
            for(let t of e.changedTouches) {
                if(t.clientX > window.innerWidth / 2 && this.lookTouchId === null) {
                    this.lookTouchId = t.identifier;
                    lx = t.clientX; ly = t.clientY;
                }
            }
        });

        window.addEventListener('touchmove', (e) => {
            for(let t of e.changedTouches) {
                if(t.identifier === this.lookTouchId) {
                    const sens = 0.006;
                    this.rot.y -= (t.clientX - lx) * sens;
                    this.rot.x = Math.max(-1.5, Math.min(1.5, this.rot.x - (t.clientY - ly) * sens));
                    lx = t.clientX; ly = t.clientY;
                }
            }
        }, {passive: false});

        window.addEventListener('touchend', (e) => {
            for(let t of e.changedTouches) {
                if(t.identifier === this.lookTouchId) this.lookTouchId = null;
            }
        });
    },

    collide(newPos, world) {
        const pts = [0.2, 1.6]; // Точки проверки: ноги и голова
        for(let h of pts) {
            const key = `${Math.round(newPos.x)},${Math.floor(newPos.y + h)},${Math.round(newPos.z)}`;
            if(world.has(key)) return true;
        }
        return false;
    },

    update(world) {
        if(Main.isInMenu) return;

        // Гравитация
        this.vel.y -= 0.015;
        let nextY = this.pos.y + this.vel.y;

        if(!this.collide({x: this.pos.x, y: nextY, z: this.pos.z}, world)) {
            this.pos.y = nextY;
            this.isGrounded = false;
        } else {
            if(this.vel.y < 0) {
                this.isGrounded = true;
                this.pos.y = Math.floor(this.pos.y + 0.1); // Мягкое приземление
            }
            this.vel.y = 0;
        }

        // Движение
        const speed = 0.13;
        const dx = (this.input.f * Math.sin(this.rot.y) + this.input.s * Math.cos(this.rot.y)) * speed;
        const dz = (this.input.f * Math.cos(this.rot.y) - this.input.s * Math.sin(this.rot.y)) * speed;

        if(!this.collide({x: this.pos.x + dx, y: this.pos.y, z: this.pos.z}, world)) this.pos.x += dx;
        if(!this.collide({x: this.pos.x, y: this.pos.y, z: this.pos.z + dz}, world)) this.pos.z += dz;

        if(this.pos.y < -20) this.pos.set(0, 15, 0); // Спавн при падении
    }
};

/**
 * Логика Игрока: Физика, Коллизии, Управление
 */
const Player = {
    pos: new THREE.Vector3(0, 15, 0),
    vel: new THREE.Vector3(0, 0, 0),
    rot: { x: 0, y: 0 },
    input: { forward: 0, side: 0 },
    isGrounded: false,
    height: 1.7,
    radius: 0.35,

    init() {
        this.setupJoystick();
        this.setupLook();
    },

    setupJoystick() {
        const base = document.getElementById('joy-base');
        const stick = document.getElementById('joy-stick');
        
        const move = (e) => {
            e.preventDefault();
            const t = e.touches ? e.touches[0] : e;
            const r = base.getBoundingClientRect();
            const cx = r.left + r.width/2, cy = r.top + r.height/2;
            const dx = t.clientX - cx, dy = t.clientY - cy;
            const d = Math.min(50, Math.sqrt(dx*dx + dy*dy));
            const a = Math.atan2(dy, dx);
            
            stick.style.transform = `translate(${Math.cos(a)*d}px, ${Math.sin(a)*d}px)`;
            this.input.forward = -Math.sin(a) * (d/50);
            this.input.side = Math.cos(a) * (d/50);
        };

        base.addEventListener('touchstart', move, {passive: false});
        base.addEventListener('touchmove', move, {passive: false});
        base.addEventListener('touchend', () => {
            stick.style.transform = '';
            this.input.forward = 0; this.input.side = 0;
        });
    },

    setupLook() {
        let lx, ly;
        window.addEventListener('touchmove', e => {
            const t = e.touches[0];
            if(t.clientX > window.innerWidth / 2) {
                if(lx) {
                    this.rot.y -= (t.clientX - lx) * 0.007;
                    this.rot.x = Math.max(-1.5, Math.min(1.5, this.rot.x - (t.clientY - ly) * 0.007));
                }
                lx = t.clientX; ly = t.clientY;
            }
        }, {passive: false});
        window.addEventListener('touchend', () => { lx = null; ly = null; });
    },

    checkCollision(newPos, world) {
        // Проверка ног, пояса и головы
        const checks = [0.2, 0.9, 1.6]; 
        for(let h of checks) {
            const pts = [
                {x: newPos.x-this.radius, z: newPos.z-this.radius},
                {x: newPos.x+this.radius, z: newPos.z-this.radius},
                {x: newPos.x-this.radius, z: newPos.z+this.radius},
                {x: newPos.x+this.radius, z: newPos.z+this.radius}
            ];
            for(let p of pts) {
                const k = `${Math.round(p.x)},${Math.floor(newPos.y + h)},${Math.round(p.z)}`;
                if(world.has(k)) return true;
            }
        }
        return false;
    },

    update(world) {
        // Гравитация
        this.vel.y -= 0.016;
        let nextY = this.pos.y + this.vel.y;
        
        if(!this.checkCollision({x: this.pos.x, y: nextY, z: this.pos.z}, world)) {
            this.pos.y = nextY;
            this.isGrounded = false;
        } else {
            if(this.vel.y < 0) {
                this.pos.y = Math.floor(this.pos.y + 0.01);
                this.isGrounded = true;
            }
            this.vel.y = 0;
        }

        // Движение
        const speed = 0.13;
        const dx = (this.input.forward * Math.sin(this.rot.y) + this.input.side * Math.cos(this.rot.y)) * speed;
        const dz = (this.input.forward * Math.cos(this.rot.y) - this.input.side * Math.sin(this.rot.y)) * speed;

        if(!this.checkCollision({x: this.pos.x + dx, y: this.pos.y, z: this.pos.z}, world)) this.pos.x += dx;
        if(!this.checkCollision({x: this.pos.x, y: this.pos.y, z: this.pos.z + dz}, world)) this.pos.z += dz;

        // Провал в пустоту
        if(this.pos.y < -20) this.pos.set(0, 15, 0);
    }
};

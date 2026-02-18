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
    radius: 0.3,

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
            
            // Расчет направления движения
            this.input.forward = -Math.sin(a + Math.PI/2) * (d/50);
            this.input.side = Math.cos(a + Math.PI/2) * (d/50);
        };

        base.addEventListener('touchstart', move, {passive: false});
        base.addEventListener('touchmove', move, {passive: false});
        base.addEventListener('touchend', (e) => {
            e.preventDefault();
            stick.style.transform = '';
            this.input.forward = 0; 
            this.input.side = 0;
        });
    },

    setupLook() {
        let lx, ly;
        window.addEventListener('touchmove', e => {
            const t = e.touches[0];
            if(t.clientX > window.innerWidth / 2) {
                if(lx !== undefined) {
                    this.rot.y -= (t.clientX - lx) * 0.008;
                    this.rot.x = Math.max(-1.5, Math.min(1.5, this.rot.x - (t.clientY - ly) * 0.008));
                }
                lx = t.clientX; ly = t.clientY;
            }
        }, {passive: false});
        window.addEventListener('touchend', () => { lx = undefined; ly = undefined; });
    },

    checkCollision(newPos, worldMap) {
        if (!worldMap) return false;
        // Проверка в двух точках по высоте
        const levels = [0.2, 1.5]; 
        for(let h of levels) {
            const bx = Math.round(newPos.x);
            const by = Math.floor(newPos.y + h);
            const bz = Math.round(newPos.z);
            if(worldMap.has(`${bx},${by},${bz}`)) return true;
        }
        return false;
    },

    update(worldMap) {
        // Если мы в меню, физика игрока отключена
        if (Main.isInMenu) return;

        // 1. Гравитация
        this.vel.y -= 0.015;
        let nextY = this.pos.y + this.vel.y;
        
        if(!this.checkCollision({x: this.pos.x, y: nextY, z: this.pos.z}, worldMap)) {
            this.pos.y = nextY;
            this.isGrounded = false;
        } else {
            if(this.vel.y < 0) {
                this.pos.y = Math.round(this.pos.y);
                this.isGrounded = true;
            }
            this.vel.y = 0;
        }

        // 2. Движение
        const speed = 0.12;
        const dx = (this.input.forward * Math.sin(this.rot.y) + this.input.side * Math.cos(this.rot.y)) * speed;
        const dz = (this.input.forward * Math.cos(this.rot.y) - this.input.side * Math.sin(this.rot.y)) * speed;

        if(!this.checkCollision({x: this.pos.x + dx, y: this.pos.y, z: this.pos.z}, worldMap)) {
            this.pos.x += dx;
        }
        if(!this.checkCollision({x: this.pos.x, y: this.pos.y, z: this.pos.z + dz}, worldMap)) {
            this.pos.z += dz;
        }

        // Телепорт при падении в бездну
        if(this.pos.y < -10) { 
            this.pos.set(0, 10, 0); 
            this.vel.set(0,0,0); 
        }
    }
};

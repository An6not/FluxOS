class Player {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.velocity = new THREE.Vector3();
        this.moveDir = { forward: 0, side: 0 };
        this.lookDelta = { x: 0, y: 0 };
        this.onGround = false;
        
        // Мультитач данные
        this.pointers = new Map();
        
        this.setupControls();
        this.createModel();
    }

    createModel() {
        // Простая моделька игрока (тело)
        this.mesh = SkinManager.createSteve();
        this.scene.add(this.mesh);
    }

    setupControls() {
        const joyZone = document.getElementById('joystick-zone');
        const stick = document.getElementById('joystick-stick');

        // Pointer Events для поддержки мультитач
        window.addEventListener('pointerdown', (e) => {
            this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.pointers.has(e.pointerId)) return;
            
            const prev = this.pointers.get(e.pointerId);
            const dx = e.clientX - prev.x;
            const dy = e.clientY - prev.y;

            // Если касание в зоне джойстика
            if (e.target.closest('#joystick-zone')) {
                const limit = 40;
                const dist = Math.min(Math.sqrt(dx*dx + dy*dy), limit);
                const angle = Math.atan2(dy, dx);
                
                stick.style.transform = `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px)`;
                this.moveDir.forward = -Math.sin(angle) * (dist/limit);
                this.moveDir.side = -Math.cos(angle) * (dist/limit);
            } else {
                // Вращение камеры
                this.camera.rotation.y -= dx * 0.005;
                this.camera.rotation.x -= dy * 0.005;
                this.camera.rotation.x = Math.max(-1.5, Math.min(1.5, this.camera.rotation.x));
            }
            
            this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        });

        window.addEventListener('pointerup', (e) => {
            this.pointers.delete(e.pointerId);
            if (e.target.closest('#joystick-zone')) {
                stick.style.transform = `translate(0, 0)`;
                this.moveDir.forward = 0;
                this.moveDir.side = 0;
            }
        });

        document.getElementById('btn-jump').ontouchstart = () => {
            if(this.onGround) this.velocity.y = 0.15;
        };
    }

    update(dt, blocks) {
        // Физика
        this.velocity.y -= 0.008; 
        this.camera.position.y += this.velocity.y;

        if (this.camera.position.y < 2) {
            this.camera.position.y = 2;
            this.velocity.y = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }

        // Движение
        const angle = this.camera.rotation.y;
        this.camera.position.x += (Math.sin(angle) * this.moveDir.forward + Math.cos(angle) * this.moveDir.side) * 0.1;
        this.camera.position.z += (Math.cos(angle) * this.moveDir.forward - Math.sin(angle) * this.moveDir.side) * 0.1;

        // Синхронизация модельки (сетка игрока)
        if(this.mesh) {
            this.mesh.position.set(this.camera.position.x, this.camera.position.y - 1.5, this.camera.position.z);
            this.mesh.rotation.y = this.camera.rotation.y;
        }
    }
}

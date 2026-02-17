/**
 * ANNOTCRAFT PLATINUM ENGINE v25.0
 * Senior Fullstack Developer Core
 */

// --- ГЛОБАЛЬНЫЕ НАСТРОЙКИ ---
const CONFIG = {
    GRAVITY: 0.016,
    JUMP_STRENGTH: 0.28,
    WALK_SPEED: 0.13,
    BOB_SPEED: 0.008,
    BOB_AMOUNT: 0.06,
    RENDER_DISTANCE: 120,
    FOV: 75,
    COLLISION_PADDING: 0.3
};

// --- ВСПОМОГАТЕЛЬНЫЕ МОДУЛИ ---
const Utils = {
    toggleFullscreen() {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
    },
    getDistance(v1, v2) {
        return Math.sqrt((v1.x-v2.x)**2 + (v1.y-v2.y)**2 + (v1.z-v2.z)**2);
    }
};

const AssetsManager = {
    textures: {},
    materials: {},

    init() {
        const createTex = (baseColor, hasGrass = false) => {
            const canvas = document.createElement('canvas');
            canvas.width = 16; canvas.height = 16;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, 16, 16);
            // Шум
            for(let i=0; i<40; i++) {
                ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.2})`;
                ctx.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 1, 1);
            }
            if(hasGrass) {
                ctx.fillStyle = '#5ba848';
                ctx.fillRect(0, 0, 16, 5);
                for(let i=0; i<16; i++) if(Math.random()>0.5) ctx.fillRect(i, 5, 1, 1);
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.magFilter = tex.minFilter = THREE.NearestFilter;
            return tex;
        };

        this.textures = {
            grass_top: createTex('#5ba848'),
            grass_side: createTex('#795548', true),
            dirt: createTex('#795548'),
            stone: createTex('#888888'),
            wood_side: createTex('#6d4c41'),
            leaf: createTex('#4caf50')
        };
    },

    getBlockMaterial(id) {
        const wrap = (t) => new THREE.MeshLambertMaterial({ map: t });
        if(id === 0) { // Grass
            return [wrap(this.textures.grass_side), wrap(this.textures.grass_side), wrap(this.textures.grass_top), 
                    wrap(this.textures.dirt), wrap(this.textures.grass_side), wrap(this.textures.grass_side)];
        }
        if(id === 1) return wrap(this.textures.stone);
        if(id === 2) return wrap(this.textures.wood_side);
        if(id === 3) return wrap(this.textures.leaf);
        return wrap(this.textures.stone);
    }
};

// --- ГЛАВНЫЙ ОБЪЕКТ ДВИЖКА ---
const GameEngine = {
    scene: null, camera: null, renderer: null,
    world: new Map(), particles: [], clouds: [],
    player: {
        pos: new THREE.Vector3(0, 12, 0),
        vel: new THREE.Vector3(0, 0, 0),
        rot: { x: 0, y: 0 },
        isGrounded: false
    },
    controls: { forward: 0, side: 0 },
    activeBlock: 0,
    isRunning: false,

    launch(mode) {
        document.getElementById('game-menu').style.display = 'none';
        document.getElementById('ui-hud').style.display = 'block';
        this.initEngine();
    },

    initEngine() {
        AssetsManager.init();
        
        // 1. Core Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 20, CONFIG.RENDER_DISTANCE);

        // 2. Camera & Hands
        this.camera = new THREE.PerspectiveCamera(CONFIG.FOV, window.innerWidth/window.innerHeight, 0.1, 1000);
        this.handGroup = new THREE.Group();
        const handGeom = new THREE.BoxGeometry(0.3, 0.3, 0.7);
        this.handMesh = new THREE.Mesh(handGeom, AssetsManager.getBlockMaterial(0));
        this.handGroup.add(this.handMesh);
        this.handMesh.position.set(0.6, -0.6, -0.9);
        this.camera.add(this.handGroup);
        this.scene.add(this.camera);

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.getElementById('render-canvas-container').appendChild(this.renderer.domElement);

        // 4. Lighting
        const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
        const sun = new THREE.DirectionalLight(0xffffff, 0.6);
        sun.position.set(20, 100, 50);
        this.scene.add(hemi, sun);

        // 5. World Generation
        this.generateChunk(0, 0);

        // 6. Selection Box
        const selGeo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
        this.selectionMesh = new THREE.Mesh(selGeo, new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, transparent: true, opacity: 0.5 }));
        this.scene.add(this.selectionMesh);

        this.setupEventListeners();
        this.renderIcons();
        this.isRunning = true;
        this.animate();
    },

    generateChunk(cx, cz) {
        for(let x=-15; x<15; x++) {
            for(let z=-15; z<15; z++) {
                this.spawnBlock(x, 0, z, 0);
                // Псевдо-горы
                if(Math.random() > 0.97) {
                    const h = Math.floor(Math.random() * 4) + 1;
                    for(let y=1; y<=h; y++) this.spawnBlock(x, y, z, 1);
                }
            }
        }
        // Облака
        for(let i=0; i<10; i++) {
            const cloud = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 10), new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.6}));
            cloud.position.set(Math.random()*100-50, 35, Math.random()*100-50);
            this.scene.add(cloud); this.clouds.push(cloud);
        }
    },

    spawnBlock(x, y, z, type) {
        const key = `${x},${y},${z}`;
        if(this.world.has(key)) return;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), AssetsManager.getBlockMaterial(type));
        mesh.position.set(x, y, z);
        mesh.blockData = { type: type };
        this.scene.add(mesh);
        this.world.set(key, mesh);
    },

    checkCollision(pos) {
        const p = CONFIG.COLLISION_PADDING;
        const heights = [0.2, 1.0, 1.7]; // Ноги, Пояс, Голова
        for(let h of heights) {
            const points = [
                {x: pos.x-p, z: pos.z-p}, {x: pos.x+p, z: pos.z-p},
                {x: pos.x-p, z: pos.z+p}, {x: pos.x+p, z: pos.z+p}
            ];
            for(let pt of points) {
                const bx = Math.round(pt.x), by = Math.floor(pos.y + h), bz = Math.round(pt.z);
                if(this.world.has(`${bx},${by},${bz}`)) return true;
            }
        }
        return false;
    },

    animate() {
        if(!this.isRunning) return;
        requestAnimationFrame(() => this.animate());

        const time = Date.now();

        // 1. Физика гравитации
        this.player.vel.y -= CONFIG.GRAVITY;
        let nextY = this.player.pos.y + this.player.vel.y;
        
        if(!this.checkCollision({x: this.player.pos.x, y: nextY, z: this.player.pos.z})) {
            this.player.pos.y = nextY;
            this.player.isGrounded = false;
        } else {
            if(this.player.vel.y < 0) {
                this.player.pos.y = Math.floor(this.player.pos.y + 0.01);
                this.player.isGrounded = true;
            }
            this.player.vel.y = 0;
        }

        // 2. Движение и инерция
        const moveSpeed = CONFIG.WALK_SPEED;
        const dx = (this.controls.forward * Math.sin(this.player.rot.y) + this.controls.side * Math.cos(this.player.rot.y)) * moveSpeed;
        const dz = (this.controls.forward * Math.cos(this.player.rot.y) - this.controls.side * Math.sin(this.player.rot.y)) * moveSpeed;

        if(!this.checkCollision({x: this.player.pos.x + dx, y: this.player.pos.y, z: this.player.pos.z})) this.player.pos.x += dx;
        if(!this.checkCollision({x: this.player.pos.x, y: this.player.pos.y, z: this.player.pos.z + dz})) this.player.pos.z += dz;

        // 3. View Bobbing (Покачивание)
        let bob = 0;
        if(Math.abs(this.controls.forward) > 0.1 || Math.abs(this.controls.side) > 0.1) {
            bob = Math.sin(time * CONFIG.BOB_SPEED) * CONFIG.BOB_AMOUNT;
        }
        
        this.camera.position.set(this.player.pos.x, this.player.pos.y + 1.7 + bob, this.player.pos.z);
        this.camera.rotation.set(this.player.rot.x, this.player.rot.y, 0, 'YXZ');
        this.handGroup.position.y = bob * 0.5;

        // 4. Raycasting (Выделение)
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(0,0), this.camera);
        const hits = ray.intersectObjects(Array.from(this.world.values()));
        if(hits.length > 0) {
            this.selectionMesh.visible = true;
            this.selectionMesh.position.copy(hits[0].object.position);
            this.targetHit = hits[0];
        } else {
            this.selectionMesh.visible = false;
            this.targetHit = null;
        }

        // 5. Частицы и Облака
        this.particles.forEach((p, i) => {
            p.position.add(p.userData.vel);
            p.userData.vel.y -= 0.01;
            p.scale.multiplyScalar(0.96);
            if(p.scale.x < 0.1) { this.scene.remove(p); this.particles.splice(i, 1); }
        });
        this.clouds.forEach(c => { c.position.x += 0.01; if(c.position.x > 60) c.position.x = -60; });

        // HUD Update
        document.getElementById('val-fps').innerText = "60"; // Simplified
        document.getElementById('val-coords').innerText = `${this.player.pos.x.toFixed(1)}, ${this.player.pos.y.toFixed(1)}, ${this.player.pos.z.toFixed(1)}`;
        
        this.renderer.render(this.scene, this.camera);
    },

    spawnParticles(pos) {
        for(let i=0; i<8; i++) {
            const p = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({color: 0x555555}));
            p.position.copy(pos);
            p.userData.vel = new THREE.Vector3((Math.random()-0.5)*0.2, Math.random()*0.2, (Math.random()-0.5)*0.2);
            this.scene.add(p);
            this.particles.push(p);
        }
    },

    interact(type) {
        if(!this.targetHit) return;
        const obj = this.targetHit.object;
        const pos = obj.position;

        if(type === 'break' && pos.y !== 0) {
            this.spawnParticles(pos);
            this.scene.remove(obj);
            this.world.delete(`${pos.x},${pos.y},${pos.z}`);
        } else if(type === 'place') {
            const nPos = pos.clone().add(this.targetHit.face.normal);
            this.spawnBlock(nPos.x, nPos.y, nPos.z, this.activeBlock);
        }
        
        // Анимация руки
        this.handMesh.rotation.x = -0.4;
        setTimeout(() => this.handMesh.rotation.x = 0, 150);
    },

    setupEventListeners() {
        const joyBase = document.getElementById('joystick-base');
        const knob = document.getElementById('joystick-knob');
        
        const handleJoy = (e) => {
            e.preventDefault();
            const t = e.touches ? e.touches[0] : e;
            const rect = joyBase.getBoundingClientRect();
            const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
            const dx = t.clientX - cx, dy = t.clientY - cy;
            const dist = Math.min(50, Math.sqrt(dx*dx + dy*dy));
            const angle = Math.atan2(dy, dx);
            knob.style.transform = `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px)`;
            this.controls.forward = -Math.sin(angle) * (dist/50);
            this.controls.side = Math.cos(angle) * (dist/50);
        };

        joyBase.addEventListener('touchstart', handleJoy);
        joyBase.addEventListener('touchmove', handleJoy);
        joyBase.addEventListener('touchend', () => {
            knob.style.transform = 'none';
            this.controls.forward = 0; this.controls.side = 0;
        });

        let lastX, lastY;
        window.addEventListener('touchmove', e => {
            const t = e.touches[0];
            if(t.clientX > window.innerWidth/2) {
                if(lastX) {
                    this.player.rot.y -= (t.clientX - lastX) * 0.007;
                    this.player.rot.x = Math.max(-1.5, Math.min(1.5, this.player.rot.x - (t.clientY - lastY) * 0.007));
                }
                lastX = t.clientX; lastY = t.clientY;
            }
        });
        window.addEventListener('touchend', () => { lastX = null; lastY = null; });

        document.getElementById('btn-jump-action').ontouchstart = (e) => { e.preventDefault(); if(this.player.isGrounded) this.player.vel.y = CONFIG.JUMP_STRENGTH; };
        document.getElementById('btn-place-block').ontouchstart = (e) => { e.preventDefault(); this.interact('place'); };
        document.getElementById('btn-break-block').ontouchstart = (e) => { e.preventDefault(); this.interact('break'); };

        document.querySelectorAll('.hotbar-slot').forEach(slot => {
            slot.onclick = () => {
                this.activeBlock = parseInt(slot.dataset.index);
                document.querySelectorAll('.hotbar-slot').forEach(s => s.classList.remove('active'));
                slot.classList.add('active');
                this.handMesh.material = AssetsManager.getBlockMaterial(this.activeBlock);
            }
        });
    },

    renderIcons() {
        const blocks = [0, 1, 2, 3, 0]; 
        blocks.forEach((id, i) => {
            const c = document.getElementById('icon-'+i);
            const ctx = c.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            // Упрощенная отрисовка иконки из текстуры атласа
            const mat = AssetsManager.getBlockMaterial(id);
            const tex = Array.isArray(mat) ? mat[2].map : mat.map;
            ctx.drawImage(tex.image, 0, 0, 16, 16, 0, 0, c.width, c.height);
        });
    }
};

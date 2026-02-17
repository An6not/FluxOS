/**
 * ANNOT CRAFT PLATINUM ENGINE v21.4
 * Senior Fullstack Developer Edition
 */

const Config = {
    fov: 75,
    renderDist: 100,
    gravity: 0.015,
    jumpForce: 0.28,
    moveSpeed: 0.12,
    playerHeight: 1.6,
    collisionRadius: 0.25
};

const Core = {
    scene: null, camera: null, renderer: null,
    world: new Map(), parts: [], clouds: [],
    player: { pos: new THREE.Vector3(0, 10, 0), vY: 0, rotY: 0, rotX: 0 },
    input: { forward: 0, side: 0 },
    activeSlot: 0, isRunning: false,

    start(mode) {
        document.getElementById('screen-menu').style.display = 'none';
        document.getElementById('ui-hud').style.display = 'block';
        this.init();
    },

    init() {
        // 1. Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 20, Config.renderDist);

        this.camera = new THREE.PerspectiveCamera(Config.fov, window.innerWidth/window.innerHeight, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // 2. Lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.8);
        const sun = new THREE.DirectionalLight(0xffffff, 0.6);
        sun.position.set(10, 50, 10);
        this.scene.add(ambient, sun);

        // 3. World Generation
        this.generateTerrain();

        // 4. Player Visuals
        this.selectionBox = new THREE.Mesh(
            new THREE.BoxGeometry(1.02, 1.02, 1.02),
            new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, transparent: true, opacity: 0.4 })
        );
        this.scene.add(this.selectionBox);

        this.hand = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.6), Assets.getMat(0));
        this.camera.add(this.hand);
        this.hand.position.set(0.5, -0.5, -0.8);
        this.scene.add(this.camera);

        // 5. Systems
        UI.init();
        this.setupPhysics();
        this.isRunning = true;
        this.loop();
    },

    generateTerrain() {
        for(let x = -12; x <= 12; x++) {
            for(let z = -12; z <= 12; z++) {
                this.addBlock(x, 0, z, 0); // Трава
                if(Math.random() > 0.98) { // Деревья
                    for(let h=1; h<4; h++) this.addBlock(x, h, z, 2);
                    for(let i=-1; i<=1; i++) for(let j=-1; j<=1; j++) this.addBlock(x+i, 4, z+j, 3);
                }
            }
        }
        // Облака
        for(let i=0; i<15; i++) {
            const c = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 8), new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.7}));
            c.position.set(Math.random()*100-50, 30, Math.random()*100-50);
            this.scene.add(c); this.clouds.push(c);
        }
    },

    addBlock(x, y, z, id) {
        const key = `${x},${y},${z}`;
        if(this.world.has(key)) return;
        const b = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), Assets.getMat(id));
        b.position.set(x, y, z);
        b.blockId = id;
        this.scene.add(b);
        this.world.set(key, b);
    },

    loop() {
        if(!this.isRunning) return;
        requestAnimationFrame(() => this.loop());

        // Physics
        this.player.vY -= Config.gravity;
        let nextY = this.player.pos.y + this.player.vY;
        
        if(!this.checkCollision(this.player.pos.x, nextY, this.player.pos.z)) {
            this.player.pos.y = nextY;
        } else {
            if(this.player.vY < 0) this.player.pos.y = Math.floor(this.player.pos.y + 0.01);
            this.player.vY = 0;
        }

        // Move
        const dx = (this.input.forward * Math.sin(this.player.rotY) + this.input.side * Math.cos(this.player.rotY)) * Config.moveSpeed;
        const dz = (this.input.forward * Math.cos(this.player.rotY) - this.input.side * Math.sin(this.player.rotY)) * Config.moveSpeed;
        
        if(!this.checkCollision(this.player.pos.x + dx, this.player.pos.y, this.player.pos.z)) this.player.pos.x += dx;
        if(!this.checkCollision(this.player.pos.x, this.player.pos.y, this.player.pos.z + dz)) this.player.pos.z += dz;

        // Camera Update
        this.camera.position.set(this.player.pos.x, this.player.pos.y + Config.playerHeight, this.player.pos.z);
        this.camera.rotation.set(this.player.rotX, this.player.rotY, 0, 'YXZ');

        // Selection
        this.updateSelection();
        
        // Clouds move
        this.clouds.forEach(c => { c.position.x += 0.01; if(c.position.x > 60) c.position.x = -60; });

        // HUD Update
        document.getElementById('pos-counter').innerText = `XYZ: ${Math.round(this.player.pos.x)}, ${Math.round(this.player.pos.y)}, ${Math.round(this.player.pos.z)}`;
        
        this.renderer.render(this.scene, this.camera);
    },

    checkCollision(x, y, z) {
        const r = Config.collisionRadius;
        const checks = [
            {x: x-r, z: z-r}, {x: x+r, z: z-r},
            {x: x-r, z: z+r}, {x: x+r, z: z+r}
        ];
        for(let p of checks) {
            const bx = Math.round(p.x), bz = Math.round(p.z);
            if(this.world.has(`${bx},${Math.floor(y + 0.1)},${bz}`)) return true;
            if(this.world.has(`${bx},${Math.floor(y + Config.playerHeight)},${bz}`)) return true;
        }
        return false;
    },

    updateSelection() {
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(0,0), this.camera);
        const hits = ray.intersectObjects(Array.from(this.world.values()));
        if(hits.length > 0) {
            this.selectionBox.visible = true;
            this.selectionBox.position.copy(hits[0].object.position);
            this.target = hits[0];
        } else {
            this.selectionBox.visible = false;
            this.target = null;
        }
    },

    interact(type) {
        if(!this.target) return;
        const p = this.target.object.position;
        if(type === 'break' && p.y !== 0) {
            this.scene.remove(this.target.object);
            this.world.delete(`${p.x},${p.y},${p.z}`);
        } else if(type === 'place') {
            const np = this.target.object.position.clone().add(this.target.face.normal);
            this.addBlock(np.x, np.y, np.z, this.activeSlot);
        }
    },

    fullScreen() {
        if(!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
    }
};

const Assets = {
    textures: {},
    init() {
        const gen = (c, isS) => {
            const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16;
            const x = cv.getContext('2d');
            x.fillStyle = c; x.fillRect(0,0,16,16);
            for(let i=0; i<32; i++) { x.fillStyle=`rgba(0,0,0,${Math.random()*0.15})`; x.fillRect(Math.random()*16,Math.random()*16,1,1); }
            if(isS) { x.fillStyle='#5ba848'; x.fillRect(0,0,16,5); }
            const t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter; return t;
        };
        this.textures = {
            gs: gen('#795548', true), gt: gen('#5ba848'), d: gen('#795548'),
            s: gen('#888888'), w: gen('#6d4c41'), l: gen('#4caf50')
        };
    },
    getMat(id) {
        const m = t => new THREE.MeshLambertMaterial({map: t});
        if(id === 0) return [m(this.textures.gs),m(this.textures.gs),m(this.textures.gt),m(this.textures.d),m(this.textures.gs),m(this.textures.gs)];
        if(id === 1) return m(this.textures.s);
        if(id === 2) return m(this.textures.w);
        if(id === 3) return new THREE.MeshLambertMaterial({map: this.textures.l, transparent: true, opacity: 0.85});
        return m(this.textures.s);
    }
};

const UI = {
    init() {
        Assets.init();
        this.setupJoystick();
        this.setupButtons();
        this.renderIcons();
    },

    setupJoystick() {
        const base = document.getElementById('joy-base');
        const stick = document.getElementById('joy-stick');
        const handle = (e) => {
            const t = e.touches ? e.touches[0] : e;
            const rect = base.getBoundingClientRect();
            const cx = rect.left + 55, cy = rect.top + 55;
            const dx = t.clientX - cx, dy = t.clientY - cy;
            const dist = Math.min(45, Math.sqrt(dx*dx + dy*dy));
            const angle = Math.atan2(dy, dx);
            
            stick.style.transform = `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px)`;
            Core.input.forward = -Math.sin(angle) * (dist/45);
            Core.input.side = Math.cos(angle) * (dist/45);
        };

        base.addEventListener('touchstart', (e) => handle(e));
        base.addEventListener('touchmove', (e) => handle(e));
        base.addEventListener('touchend', () => {
            stick.style.transform = 'none';
            Core.input.forward = 0; Core.input.side = 0;
        });

        // Camera look
        let lx, ly;
        window.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            if(t.clientX > window.innerWidth/2) {
                if(lx) {
                    Core.player.rotY -= (t.clientX - lx) * 0.007;
                    Core.player.rotX = Math.max(-1.5, Math.min(1.5, Core.player.rotX - (t.clientY - ly) * 0.007));
                }
                lx = t.clientX; ly = t.clientY;
            }
        });
        window.addEventListener('touchend', () => { lx = null; ly = null; });
    },

    setupButtons() {
        document.getElementById('btn-jump').ontouchstart = () => { if(Core.player.vY === 0) Core.player.vY = Config.jumpForce; };
        document.getElementById('btn-place').ontouchstart = () => Core.interact('place');
        document.getElementById('btn-break').ontouchstart = () => Core.interact('break');

        document.querySelectorAll('.slot').forEach(s => {
            s.onclick = () => {
                Core.activeSlot = parseInt(s.dataset.id);
                document.querySelectorAll('.slot').forEach(el => el.classList.remove('active'));
                s.classList.add('active');
                Core.hand.material = Assets.getMat(Core.activeSlot);
            };
        });
    },

    renderIcons() {
        const ids = [Assets.textures.gt, Assets.textures.s, Assets.textures.w, Assets.textures.l, Assets.textures.gs];
        ids.forEach((t, i) => {
            const ctx = document.getElementById('icon-'+i).getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(t.image, 0,0,16,16,0,0,300,150);
        });
    }
};

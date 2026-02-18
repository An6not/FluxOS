const Main = {
    scene: null, camera: null, renderer: null,
    isRunning: false, isInMenu: true, menuRotation: 0,

    start() {
        this.isInMenu = false;
        document.getElementById('screen-start').style.display = 'none';
        document.getElementById('ui-hud').style.display = 'block';
        Player.pos.set(0, 15, 0);
    },

    toggleFS() {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
    },

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 10, 100);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(1);
        document.body.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const sun = new THREE.DirectionalLight(0xffffff, 0.4);
        sun.position.set(5, 20, 10);
        this.scene.add(sun);

        Game.init(this.scene);
        Player.init();
        this.setupButtons();
        this.renderSlotIcons();

        this.isRunning = true;
        this.animate();
    },

    setupButtons() {
        const handle = (id, fn) => {
            document.getElementById(id).addEventListener('touchstart', (e) => {
                e.preventDefault(); if(!this.isInMenu) fn();
            }, {passive: false});
        };

        handle('btn-jump', () => { if(Player.isGrounded) Player.vel.y = 0.25; });
        handle('btn-place', () => {
            const hit = Game.updateSelection(this.camera);
            if(hit) {
                const p = hit.object.position.clone().add(hit.face.normal);
                Game.addBlock(this.scene, Math.round(p.x), Math.round(p.y), Math.round(p.z), Game.activeId);
            }
        });
        handle('btn-break', () => {
            const hit = Game.updateSelection(this.camera);
            if(hit && hit.object.position.y !== 0) {
                this.scene.remove(hit.object);
                Game.world.delete(`${hit.object.position.x},${hit.object.position.y},${hit.object.position.z}`);
            }
        });

        document.querySelectorAll('.slot').forEach(slot => {
            slot.addEventListener('touchstart', (e) => {
                e.preventDefault();
                Game.activeId = parseInt(slot.dataset.id);
                document.querySelectorAll('.slot').forEach(s => s.classList.remove('active'));
                slot.classList.add('active');
            });
        });
    },

    renderSlotIcons() {
        for(let i=0; i<5; i++) {
            const canvas = document.getElementById('c'+i);
            const ctx = canvas.getContext('2d');
            const tex = Game.textures[i].image;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(tex, 0, 0, 16, 16, 0, 0, canvas.width, canvas.height);
        }
    },

    animate() {
        if(!this.isRunning) return;
        requestAnimationFrame(() => this.animate());

        if (this.isInMenu) {
            this.menuRotation += 0.005;
            this.camera.position.set(Math.sin(this.menuRotation)*15, 12, Math.cos(this.menuRotation)*15);
            this.camera.lookAt(0, 0, 0);
        } else {
            Player.update(Game.world);
            Game.updateSelection(this.camera);
            this.camera.position.set(Player.pos.x, Player.pos.y + Player.height, Player.pos.z);
            this.camera.rotation.set(Player.rot.x, Player.rot.y, 0, 'YXZ');
            document.getElementById('pos-val').innerText = `${Math.round(Player.pos.x)} / ${Math.round(Player.pos.y)} / ${Math.round(Player.pos.z)}`;
        }

        this.renderer.render(this.scene, this.camera);
    }
};

window.onload = () => Main.init();
window.onresize = () => {
    if(Main.camera) {
        Main.camera.aspect = window.innerWidth / window.innerHeight;
        Main.camera.updateProjectionMatrix();
        Main.renderer.setSize(window.innerWidth, window.innerHeight);
    }
};

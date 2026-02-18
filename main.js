const Main = {
    scene: null, camera: null, renderer: null,
    isRunning: false, isInMenu: true, menuRotation: 0,

    onLoad() {
        this.init();
    },

    start() {
        this.isInMenu = false;
        document.getElementById('screen-start').style.display = 'none';
        document.getElementById('ui-hud').style.display = 'block';
        Player.pos.set(0, 2, 0);
        Player.vel.set(0, 0, 0);
    },

    // ПОЧИНЕННАЯ ФУНКЦИЯ FULLSCREEN
    toggleFS() {
        const doc = window.document;
        const docEl = doc.documentElement;

        const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
        const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

        if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
            if (requestFullScreen) requestFullScreen.call(docEl);
        } else {
            if (cancelFullScreen) cancelFullScreen.call(doc);
        }
    },

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 20, 100);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const sun = new THREE.DirectionalLight(0xffffff, 0.5);
        sun.position.set(10, 50, 10);
        this.scene.add(sun);

        Game.init(this.scene);
        Player.init();
        this.setupUI();
        this.renderIcons();
        this.animate();
    },

    setupUI() {
        const jump = document.getElementById('btn-jump');
        jump.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (Player.isGrounded) Player.vel.y = 0.25;
        }, {passive: false});

        document.getElementById('btn-place').addEventListener('touchstart', (e) => {
            e.preventDefault();
            const hit = Game.updateSelection(this.camera);
            if (hit) {
                let p;
                if (hit.object.userData.isFloor) {
                    p = new THREE.Vector3(Math.round(hit.point.x), 0, Math.round(hit.point.z));
                } else {
                    p = hit.object.position.clone().sub(new THREE.Vector3(0,0.5,0)).add(hit.face.normal);
                }
                Game.addBlock(this.scene, Math.round(p.x), Math.round(p.y), Math.round(p.z), Game.activeId);
            }
        }, {passive: false});

        document.getElementById('btn-break').addEventListener('touchstart', (e) => {
            e.preventDefault();
            const hit = Game.updateSelection(this.camera);
            if (hit && !hit.object.userData.isFloor) {
                this.scene.remove(hit.object);
                const p = hit.object.position;
                Game.world.delete(`${Math.round(p.x)},${Math.round(p.y-0.5)},${Math.round(p.z)}`);
            }
        }, {passive: false});

        document.querySelectorAll('.slot').forEach(s => {
            s.addEventListener('touchstart', (e) => {
                e.preventDefault();
                Game.activeId = parseInt(s.dataset.id);
                document.querySelectorAll('.slot').forEach(el => el.classList.remove('active'));
                s.classList.add('active');
            }, {passive: false});
        });
    },

    renderIcons() {
        for(let i=0; i<5; i++) {
            const c = document.getElementById('c'+i);
            const ctx = c.getContext('2d');
            const tex = Game.textures[i].image;
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, c.width, c.height);
            ctx.drawImage(tex, 0, 0, 16, 16, 0, 0, c.width, c.height);
        }
    },

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.isInMenu) {
            this.menuRotation += 0.005;
            this.camera.position.set(Math.sin(this.menuRotation)*20, 10, Math.cos(this.menuRotation)*20);
            this.camera.lookAt(0,0,0);
        } else {
            Player.update(Game.world);
            this.camera.position.set(Player.pos.x, Player.pos.y + 1.7, Player.pos.z);
            this.camera.rotation.set(Player.rot.x, Player.rot.y, 0, 'YXZ');
            document.getElementById('pos-val').innerText = `${Math.round(Player.pos.x)} / ${Math.round(Player.pos.y)}`;
        }
        this.renderer.render(this.scene, this.camera);
    }
};
window.onload = () => Main.onLoad();
window.onresize = () => {
    Main.camera.aspect = window.innerWidth / window.innerHeight;
    Main.camera.updateProjectionMatrix();
    Main.renderer.setSize(window.innerWidth, window.innerHeight);
};

/**
 * Точка входа: Сборка всех модулей
 */
const Main = {
    scene: null, camera: null, renderer: null,
    isRunning: false,

    start() {
        document.getElementById('screen-start').style.display = 'none';
        document.getElementById('ui-hud').style.display = 'block';
        this.init();
    },

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 20, 100);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 500);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const sun = new THREE.DirectionalLight(0xffffff, 0.5);
        sun.position.set(10, 50, 10);
        this.scene.add(sun);

        Player.init();
        Game.init(this.scene);
        this.setupInput();
        this.renderIcons();

        this.isRunning = true;
        this.animate();
    },

    setupInput() {
        document.getElementById('btn-jump').ontouchstart = (e) => {
            e.preventDefault();
            if(Player.isGrounded) Player.vel.y = 0.27;
        };

        document.getElementById('btn-place').ontouchstart = (e) => {
            e.preventDefault();
            const hit = Game.updateSelection(this.camera);
            if(hit) {
                const p = hit.object.position.clone().add(hit.face.normal);
                Game.addBlock(this.scene, Math.round(p.x), Math.round(p.y), Math.round(p.z), Game.activeId);
            }
        };

        document.getElementById('btn-break').ontouchstart = (e) => {
            e.preventDefault();
            const hit = Game.updateSelection(this.camera);
            if(hit && hit.object.position.y !== 0) {
                this.scene.remove(hit.object);
                Game.world.delete(`${hit.object.position.x},${hit.object.position.y},${hit.object.position.z}`);
            }
        };

        document.querySelectorAll('.slot').forEach(s => {
            s.onclick = () => {
                Game.activeId = parseInt(s.dataset.id);
                document.querySelectorAll('.slot').forEach(el => el.classList.remove('active'));
                s.classList.add('active');
            }
        });
    },

    renderIcons() {
        const ids = [Game.textures.grass_t, Game.textures.stone, Game.textures.wood, Game.textures.leaf, Game.textures.dirt];
        ids.forEach((t, i) => {
            const ctx = document.getElementById('c'+i).getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(t.image, 0, 0, 16, 16, 0, 0, 300, 150);
        });
    },

    toggleFS() {
        if(!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
    },

    animate() {
        if(!this.isRunning) return;
        requestAnimationFrame(() => this.animate());

        Player.update(Game.world);
        Game.updateSelection(this.camera);

        this.camera.position.set(Player.pos.x, Player.pos.y + Player.height, Player.pos.z);
        this.camera.rotation.set(Player.rot.x, Player.rot.y, 0, 'YXZ');

        document.getElementById('pos-val').innerText = `${Math.round(Player.pos.x)} / ${Math.round(Player.pos.y)} / ${Math.round(Player.pos.z)}`;
        document.getElementById('count-val').innerText = Game.world.size;
        
        this.renderer.render(this.scene, this.camera);
    }
};

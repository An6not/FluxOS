/**
 * Точка входа: Управление состояниями Меню и Игры
 */
const Main = {
    scene: null, 
    camera: null, 
    renderer: null,
    isRunning: false,
    isInMenu: true,
    menuRotation: 0,

    // Инициализация при загрузке страницы
    onLoad() {
        this.init();
    },

    start() {
        this.isInMenu = false;
        document.getElementById('screen-start').style.display = 'none';
        document.getElementById('ui-hud').style.display = 'block';
        // Установка игрока в начальную позицию
        Player.pos.set(0, 15, 0);
        Player.rot.x = 0;
        Player.rot.y = 0;
    },

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, 20, 120);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 500);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const sun = new THREE.DirectionalLight(0xffffff, 0.6);
        sun.position.set(10, 50, 10);
        this.scene.add(sun);

        // Инициализация зависимых модулей
        Player.init();
        Game.init(this.scene);
        this.setupInput();
        this.renderIcons();

        this.isRunning = true;
        this.animate();
    },

    setupInput() {
        // Прыжок
        document.getElementById('btn-jump').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if(!this.isInMenu && Player.isGrounded) Player.vel.y = 0.28;
        });

        // Установка блока
        document.getElementById('btn-place').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if(this.isInMenu) return;
            const hit = Game.updateSelection(this.camera);
            if(hit) {
                const p = hit.object.position.clone().add(hit.face.normal);
                Game.addBlock(this.scene, Math.round(p.x), Math.round(p.y), Math.round(p.z), Game.activeId);
            }
        });

        // Разрушение блока
        document.getElementById('btn-break').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if(this.isInMenu) return;
            const hit = Game.updateSelection(this.camera);
            if(hit && hit.object.position.y !== 0) {
                this.scene.remove(hit.object);
                Game.world.delete(`${hit.object.position.x},${hit.object.position.y},${hit.object.position.z}`);
            }
        });

        // Выбор слота
        document.querySelectorAll('.slot').forEach(s => {
            s.onclick = () => {
                Game.activeId = parseInt(s.dataset.id);
                document.querySelectorAll('.slot').forEach(el => el.classList.remove('active'));
                s.classList.add('active');
            }
        });
    },

    renderIcons() {
        const texs = [Game.textures.grass_t, Game.textures.stone, Game.textures.wood, Game.textures.leaf, Game.textures.dirt];
        texs.forEach((t, i) => {
            const canvas = document.getElementById('c'+i);
            if(!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(t.image, 0, 0, 16, 16, 0, 0, canvas.width, canvas.height);
        });
    },

    toggleFS() {
        if(!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
    },

    animate() {
        if(!this.isRunning) return;
        requestAnimationFrame(() => this.animate());

        if (this.isInMenu) {
            // Вращение камеры в меню
            this.menuRotation += 0.003;
            this.camera.position.set(
                Math.sin(this.menuRotation) * 20, 
                10, 
                Math.cos(this.menuRotation) * 20
            );
            this.camera.lookAt(0, 0, 0);
        } else {
            // Обычный игровой процесс
            Player.update(Game.world);
            Game.updateSelection(this.camera);
            
            this.camera.position.set(Player.pos.x, Player.pos.y + Player.height, Player.pos.z);
            this.camera.rotation.set(Player.rot.x, Player.rot.y, 0, 'YXZ');
            
            document.getElementById('pos-val').innerText = 
                `${Math.round(Player.pos.x)} / ${Math.round(Player.pos.y)} / ${Math.round(Player.pos.z)}`;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
};

// Самозапуск при готовности окна
window.onload = () => Main.onLoad();

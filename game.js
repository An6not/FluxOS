class MinecraftGame {
    constructor(host) {
        this.host = host;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.clock = new THREE.Clock();
        this.blocks = [];
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);

        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

        const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
        this.scene.add(light);

        this.generatePlatform();
        
        this.player = new Player(this.camera, this.scene);
        this.player.isHost = this.host.isAdmin;

        this.animate();
        window.addEventListener('resize', () => this.onResize());
    }

    generatePlatform() {
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshLambertMaterial({ color: 0x559955 });
        
        // Создаем платформу 16x16
        for(let x = -8; x < 8; x++) {
            for(let z = -8; z < 8; z++) {
                const cube = new THREE.Mesh(geo, mat);
                cube.position.set(x, 0, z);
                this.scene.add(cube);
                this.blocks.push(cube);
            }
        }
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = this.clock.getDelta();
        this.player.update(delta, this.blocks);
        this.renderer.render(this.scene, this.camera);
    }
}

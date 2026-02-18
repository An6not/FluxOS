/**
 * Логика Мира: Блоки, Текстуры, Рендеринг
 */
const Game = {
    world: new Map(),
    activeId: 0,
    textures: {},
    particles: [],

    init(scene) {
        this.generateAssets();
        this.generateTerrain(scene);
        this.setupSelection(scene);
    },

    generateAssets() {
        const gen = (c, isG) => {
            const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16;
            const x = cv.getContext('2d');
            x.fillStyle = c; x.fillRect(0,0,16,16);
            for(let i=0; i<30; i++) {
                x.fillStyle = `rgba(0,0,0,${Math.random()*0.15})`;
                x.fillRect(Math.random()*16, Math.random()*16, 1, 1);
            }
            if(isG) { x.fillStyle='#5ba848'; x.fillRect(0,0,16,5); }
            const t = new THREE.CanvasTexture(cv);
            t.magFilter = t.minFilter = THREE.NearestFilter;
            return t;
        };
        this.textures = {
            grass_s: gen('#795548', true),
            grass_t: gen('#5ba848'),
            dirt: gen('#795548'),
            stone: gen('#888888'),
            wood: gen('#6d4c41'),
            leaf: gen('#4caf50')
        };
    },

    getMat(id) {
        const m = t => new THREE.MeshLambertMaterial({ map: t });
        if(id === 0) return [m(this.textures.grass_s), m(this.textures.grass_s), m(this.textures.grass_t), m(this.textures.dirt), m(this.textures.grass_s), m(this.textures.grass_s)];
        if(id === 1) return m(this.textures.stone);
        if(id === 2) return m(this.textures.wood);
        if(id === 3) return new THREE.MeshLambertMaterial({ map: this.textures.leaf, transparent: true, opacity: 0.8 });
        return m(this.textures.dirt);
    },

    generateTerrain(scene) {
        for(let x=-12; x<=12; x++) {
            for(let z=-12; z<=12; z++) {
                this.addBlock(scene, x, 0, z, 0);
                // Рандомные деревья
                if(Math.random() > 0.985) {
                    for(let h=1; h<5; h++) this.addBlock(scene, x, h, z, 2);
                    for(let ix=-1; ix<=1; ix++) for(let iz=-1; iz<=1; iz++) this.addBlock(scene, x+ix, 5, z+iz, 3);
                }
            }
        }
    },

    addBlock(scene, x, y, z, id) {
        const k = `${x},${y},${z}`;
        if(this.world.has(k)) return;
        const b = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.getMat(id));
        b.position.set(x, y, z);
        scene.add(b);
        this.world.set(k, b);
    },

    setupSelection(scene) {
        this.selBox = new THREE.Mesh(
            new THREE.BoxGeometry(1.02, 1.02, 1.02),
            new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, transparent: true, opacity: 0.4 })
        );
        scene.add(this.selBox);
    },

    updateSelection(cam) {
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(0,0), cam);
        const hits = ray.intersectObjects(Array.from(this.world.values()));
        if(hits.length > 0) {
            this.selBox.visible = true;
            this.selBox.position.copy(hits[0].object.position);
            return hits[0];
        }
        this.selBox.visible = false;
        return null;
    }
};

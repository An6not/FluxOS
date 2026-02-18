const Game = {
    world: new Map(),
    textures: {},
    activeId: 0,
    blockData: [
        { name: 'Grass', col: '#5ba848' },
        { name: 'Stone', col: '#888888' },
        { name: 'Wood', col: '#6d4c41' },
        { name: 'Leaf', col: '#4caf50' },
        { name: 'Dirt', col: '#795548' }
    ],

    init(scene) {
        // Генерация текстур «на лету»
        this.blockData.forEach((data, i) => {
            const canvas = document.createElement('canvas');
            canvas.width = 16; canvas.height = 16;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = data.col;
            ctx.fillRect(0, 0, 16, 16);
            // Добавляем шум для текстурности
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for(let n=0; n<20; n++) ctx.fillRect(Math.random()*16, Math.random()*16, 2, 2);
            
            const tex = new THREE.CanvasTexture(canvas);
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            this.textures[i] = tex;
        });

        // Генерация начальной платформы
        for(let x=-8; x<=8; x++) {
            for(let z=-8; z<=8; z++) {
                this.addBlock(scene, x, 0, z, 0);
            }
        }
    },

    addBlock(scene, x, y, z, id) {
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshLambertMaterial({ map: this.textures[id] });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        this.world.set(`${x},${y},${z}`, mesh);
    },

    updateSelection(camera) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(Array.from(this.world.values()));
        return intersects[0] || null;
    }
};

const Game = {
    world: new Map(),
    textures: {},
    activeId: 0,
    blockData: [
        { name: 'Grass', col: '#5ba848', noise: '#4e8d3e' },
        { name: 'Stone', col: '#888888', noise: '#777777' },
        { name: 'Wood', col: '#6d4c41', noise: '#5d3f35' },
        { name: 'Leaf', col: '#4caf50', noise: '#3d8b40' },
        { name: 'Dirt', col: '#795548', noise: '#654339' }
    ],

    init(scene) {
        // УЛУЧШЕННАЯ ГЕНЕРАЦИЯ ТЕКСТУР (ПИКСЕЛЬ-АРТ)
        this.blockData.forEach((data, i) => {
            const canvas = document.createElement('canvas');
            canvas.width = 16; canvas.height = 16;
            const ctx = canvas.getContext('2d');
            
            // Базовый слой
            ctx.fillStyle = data.col;
            ctx.fillRect(0, 0, 16, 16);
            
            // Слой шума (пиксельные детали)
            for(let x=0; x<16; x++) {
                for(let y=0; y<16; y++) {
                    if(Math.random() > 0.7) {
                        ctx.fillStyle = data.noise;
                        ctx.fillRect(x, y, 1, 1);
                    } else if(Math.random() < 0.1) {
                        ctx.fillStyle = 'rgba(255,255,255,0.05)';
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
            
            const tex = new THREE.CanvasTexture(canvas);
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            this.textures[i] = tex;
        });

        // Платформа
        const groundGeo = new THREE.PlaneGeometry(200, 200);
        const groundMat = new THREE.MeshLambertMaterial({ map: this.textures[0] });
        this.textures[0].wrapS = THREE.RepeatWrapping;
        this.textures[0].wrapT = THREE.RepeatWrapping;
        this.textures[0].repeat.set(100, 100);

        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.userData.isFloor = true;
        scene.add(ground);
        this.floor = ground;
    },

    addBlock(scene, x, y, z, id) {
        const key = `${x},${y},${z}`;
        if (this.world.has(key)) return;

        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshLambertMaterial({ map: this.textures[id] });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y + 0.5, z);
        scene.add(mesh);
        this.world.set(key, mesh);
    },

    updateSelection(camera) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const objects = [...Array.from(this.world.values()), this.floor];
        const intersects = raycaster.intersectObjects(objects);
        return intersects[0] || null;
    }
};

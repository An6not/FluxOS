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
        // Генерация текстур
        this.blockData.forEach((data, i) => {
            const canvas = document.createElement('canvas');
            canvas.width = 16; canvas.height = 16;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = data.col;
            ctx.fillRect(0, 0, 16, 16);
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for(let n=0; n<15; n++) ctx.fillRect(Math.random()*16, Math.random()*16, 2, 2);
            
            const tex = new THREE.CanvasTexture(canvas);
            tex.magFilter = THREE.NearestFilter;
            this.textures[i] = tex;
        });

        // СОЗДАНИЕ ЕДИНОЙ ПЛАТФОРМЫ (БЕЗ БАГОВ СТЫКОВ)
        const groundGeo = new THREE.PlaneGeometry(100, 100);
        const groundMat = new THREE.MeshLambertMaterial({ map: this.textures[0] });
        // Повторяем текстуру травы на полу
        this.textures[0].wrapS = THREE.RepeatWrapping;
        this.textures[0].wrapT = THREE.RepeatWrapping;
        this.textures[0].repeat.set(50, 50);

        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        scene.add(ground);
        
        // Помечаем для Raycaster, но не добавляем в Map блоков (т.к. это пол)
        ground.userData.isFloor = true;
        this.floor = ground;
    },

    addBlock(scene, x, y, z, id) {
        if (y < 0) return;
        const key = `${x},${y},${z}`;
        if (this.world.has(key)) return;

        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshLambertMaterial({ map: this.textures[id] });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y + 0.5, z); // Смещение на 0.5, чтобы блок стоял ровно на сетке
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

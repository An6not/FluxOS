/**
 * WEBCRAFT ULTRA ENGINE v2.5
 * Глубокая проработка ландшафта, физики и мультиплеера
 */

"use strict";

// 1. КОНСТАНТЫ МИРА И РЕНДЕРА
const WORLD_CONFIG = {
    CHUNK_SIZE: 16,
    CHUNK_HEIGHT: 64,
    RENDER_DISTANCE: 4, // Радиус в чанках
    WATER_LEVEL: 15,
    SEED: Math.random() * 100000,
    GRAVITY: 0.015,
    TERMINAL_VELOCITY: 0.5,
};

// 2. РЕГИСТР БЛОКОВ (Свойства и текстуры)
const BLOCK_TYPES = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    WOOD: 4,
    LEAVES: 5,
    WATER: 6,
    BEDROCK: 7,
    SAND: 8
};

// Глобальные игровые объекты
let scene, camera, renderer, clock, simplex;
let player, world, network, ui;
let instancedBlocks = {}; // Для оптимизации отрисовки

// 3. ИНИЦИАЛИЗАЦИЯ ДВИЖКА
window.initGameEngine = function(isHost) {
    console.log("Engine: Launching...");
    
    // Создание сцены
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Небо
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.02); // Туман для скрытия границ мира

    // Камера
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Рендерер
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        powerPreference: "high-performance" 
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('webgl-output').appendChild(renderer.domElement);

    // Свет (Солнце)
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    // Продолжение инициализации в initGameEngine
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Мягкий заполняющий свет
    scene.add(sun, ambientLight);

    // Инициализация шума Simplex для рельефа
    simplex = new SimplexNoise(WORLD_CONFIG.SEED);
    clock = new THREE.Clock();

    // Создание объекта мира
    world = new World();
    
    // Создание игрока
    player = new Player();
    
    // Запуск цикла рендеринга
    animate();
};

// 4. КЛАСС МИРА (Управление блоками и ландшафтом)
class World {
    constructor() {
        this.chunks = {};
        this.textureLoader = new THREE.TextureLoader();
        this.materials = this.initMaterials();
        this.geometry = new THREE.BoxGeometry(1, 1, 1);
        
        // Предварительная генерация спавна (чтобы не было дыр)
        this.generateSpawnArea();
    }

    initMaterials() {
        // Создание текстур с эффектом "Pixel Perfect"
        const loadTex = (url) => {
            const t = this.textureLoader.load(url);
            t.magFilter = THREE.NearestFilter;
            t.minFilter = THREE.LinearMipMapLinearFilter;
            return t;
        };

        return {
            grass: [
                new THREE.MeshLambertMaterial({ map: loadTex('https://i.imgur.com/v6Spx7X.png') }), // side
                new THREE.MeshLambertMaterial({ map: loadTex('https://i.imgur.com/39SOnp8.png') }), // top
                new THREE.MeshLambertMaterial({ map: loadTex('https://i.imgur.com/v6Spx7X.png') }), // bottom
            ],
            dirt: new THREE.MeshLambertMaterial({ map: loadTex('https://i.imgur.com/v6Spx7X.png') }),
            stone: new THREE.MeshLambertMaterial({ map: loadTex('https://i.imgur.com/8N3vH89.png') }),
            sand: new THREE.MeshLambertMaterial({ map: loadTex('https://i.imgur.com/K7P7oXk.png') }),
            water: new THREE.MeshPhongMaterial({ 
                color: 0x1565C0, 
                transparent: true, 
                opacity: 0.6,
                shininess: 90 
            })
        };
    }

    // Генерация высоты ландшафта (Рельеф)
    getHeight(x, z) {
        // Смешивание нескольких слоев шума для реалистичных холмов
        let noise1 = simplex.noise2D(x * 0.02, z * 0.02) * 10; // Крупные горы
        let noise2 = simplex.noise2D(x * 0.1, z * 0.1) * 2;    // Мелкие кочки
        return Math.floor(noise1 + noise2 + WORLD_CONFIG.CHUNK_HEIGHT / 3);
    }

    generateSpawnArea() {
        console.log("World: Generating spawn safe zone...");
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                this.generateChunk(x, z);
            }
        }
    }

    generateChunk(cx, cz) {
        const key = `${cx},${cz}`;
        if (this.chunks[key]) return;

        const chunkData = [];
        const instancedMeshes = {}; // Группировка для оптимизации

        for (let x = 0; x < WORLD_CONFIG.CHUNK_SIZE; x++) {
            for (let z = 0; z < WORLD_CONFIG.CHUNK_SIZE; z++) {
                const worldX = cx * WORLD_CONFIG.CHUNK_SIZE + x;
                const worldZ = cz * WORLD_CONFIG.CHUNK_SIZE + z;
                const h = this.getHeight(worldX, worldZ);

                for (let y = 0; y < WORLD_CONFIG.CHUNK_HEIGHT; y++) {
                    let type = BLOCK_TYPES.AIR;
                    
                    if (y === h) type = BLOCK_TYPES.GRASS;
                    else if (y < h && y > h - 3) type = BLOCK_TYPES.DIRT;
                    else if (y <= h - 3) type = BLOCK_TYPES.STONE;
                    else if (y <= WORLD_CONFIG.WATER_LEVEL && y > h) type = BLOCK_TYPES.WATER;

                    if (type !== BLOCK_TYPES.AIR) {
                        this.addBlockToScene(worldX, y, worldZ, type);
                    }
                }
            }
        }
        this.chunks[key] = true;
    }
        // Продолжение класса World в main.js
    addBlockToScene(x, y, z, type) {
        if (!this.chunksData) this.chunksData = {};
        
        // Регистрируем блок в сетке для физики
        const posKey = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
        this.chunksData[posKey] = type;

        // Логика визуализации через InstancedMesh (подготовка)
        // В финальном рендере мы вызовем mesh.setMatrixAt
        this.dirty = true; 
    }

    getBlock(x, y, z) {
        const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
        return this.chunksData[key] || BLOCK_TYPES.AIR;
    }
}

// 5. КЛАСС ИГРОКА (Физика и коллизии без дыр)
class Player {
    constructor() {
        this.position = new THREE.Vector3(0, 40, 0); // Спавн высоко в небе
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.speed = WORLD_CONFIG.WALK_SPEED / 60;
        this.eyeHeight = 1.7;
        this.onGround = false;
        
        // Лучи для проверки пола под ногами
        this.raycaster = new THREE.Raycaster();
    }

    update(delta, input) {
        // Применяем гравитацию
        if (!this.onGround) {
            this.velocity.y -= WORLD_CONFIG.GRAVITY * delta;
        }

        // Ограничение скорости падения
        if (this.velocity.y < -WORLD_CONFIG.TERMINAL_VELOCITY) {
            this.velocity.y = -WORLD_CONFIG.TERMINAL_VELOCITY;
        }

        // Расчет движения на основе ввода
        const moveDir = new THREE.Vector3();
        if (input.up) moveDir.z -= 1;
        if (input.down) moveDir.z += 1;
        if (input.left) moveDir.x -= 1;
        if (input.right) moveDir.x += 1;
        
        moveDir.normalize();
        moveDir.applyEuler(new THREE.Euler(0, this.rotation.y, 0));

        // Применяем движение к осям по отдельности для точных коллизий
        this.applyMoveWithCollisions(moveDir.x * this.speed * delta, 'x');
        this.applyMoveWithCollisions(this.velocity.y * delta, 'y');
        this.applyMoveWithCollisions(moveDir.z * this.speed * delta, 'z');

        // Обновление камеры
        camera.position.copy(this.position);
        camera.position.y += this.eyeHeight;
        camera.rotation.copy(this.rotation);
    }

    applyMoveWithCollisions(amount, axis) {
        // Сохраняем старую позицию на случай отката
        const oldPos = this.position[axis];
        this.position[axis] += amount;

        // Создаем "хитбокс" игрока (проверяем углы куба)
        const radius = 0.3;
        const height = 1.8;
        
        let collision = false;
        // Проверяем 8 точек хитбокса на пересечение с блоками
        for (let xOff = -radius; xOff <= radius; xOff += radius * 2) {
            for (let yOff = 0; yOff <= height; yOff += height / 2) {
                for (let zOff = -radius; zOff <= radius; zOff += radius * 2) {
                    const checkX = this.position.x + (axis === 'x' ? 0 : xOff);
                    const checkY = this.position.y + (axis === 'y' ? 0 : yOff);
                    const checkZ = this.position.z + (axis === 'z' ? 0 : zOff);

                    if (world.getBlock(checkX, checkY, checkZ) !== BLOCK_TYPES.AIR && 
                        world.getBlock(checkX, checkY, checkZ) !== BLOCK_TYPES.WATER) {
                        collision = true;
                        break;
                    }
                }
                if (collision) break;
            }
            if (collision) break;
        }

        if (collision) {
            if (axis === 'y') {
                if (amount < 0) this.onGround = true;
                this.velocity.y = 0;
            }
            this.position[axis] = oldPos; // Откат позиции при столкновении
        } else if (axis === 'y') {
            this.onGround = false;
        }
    }
        // Продолжение класса Player в main.js

    jump() {
        if (this.onGround) {
            this.velocity.y = WORLD_CONFIG.JUMP_FORCE * 0.02; // Импульс вверх
            this.onGround = false;
        }
    }

    handleFallDamage(fallDistance) {
        if (fallDistance > 3.5) { // Урон начинается после падения с 3.5 блоков
            const damage = Math.floor((fallDistance - 3) * 2);
            WebCraft.ui.updateHP(WebCraft.state.hp - damage);
            
            // Визуальный эффект покраснения экрана
            const overlay = document.getElementById('damage-overlay');
            overlay.style.opacity = '0.8';
            setTimeout(() => overlay.style.opacity = '0', 200);
        }
    }

    // Метод для определения блока перед игроком
    getLookedBlock() {
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        
        const raycaster = new THREE.Raycaster(
            camera.position, 
            direction, 
            0, 
            WORLD_CONFIG.reachDistance
        );

        // Получаем все меши чанков (InstancedMeshes)
        const intersects = raycaster.intersectObjects(world.getRenderableMeshes());

        if (intersects.length > 0) {
            const intersect = intersects[0];
            // Вычисляем точные координаты блока
            const point = intersect.point.clone().add(direction.multiplyScalar(0.001));
            const x = Math.floor(point.x);
            const y = Math.floor(point.y);
            const z = Math.floor(point.z);

            return { x, y, z, face: intersect.face, object: intersect.object };
        }
        return null;
    }

    interact(isDestroying) {
        const target = this.getLookedBlock();
        if (!target) return;

        if (isDestroying) {
            // Разрушение блока
            world.setBlock(target.x, target.y, target.z, BLOCK_TYPES.AIR);
            this.playHandAnimation('punch');
            
            // Сетевая синхронизация
            WebCraft.network.sendPacket({
                type: 'block',
                x: target.x, y: target.y, z: target.z,
                id: BLOCK_TYPES.AIR
            });
        } else {
            // Установка блока (вычисляем позицию рядом с гранью)
            const normal = target.face.normal.clone();
            const placeX = target.x + Math.round(normal.x);
            const placeY = target.y + Math.round(normal.y);
            const placeZ = target.z + Math.round(normal.z);

            // Проверка, не стоит ли там сам игрок
            if (!this.checkPlayerCollision(placeX, placeY, placeZ)) {
                const blockToPlace = WebCraft.state.inventory[WebCraft.state.activeSlot] || BLOCK_TYPES.DIRT;
                world.setBlock(placeX, placeY, placeZ, blockToPlace);
                
                WebCraft.network.sendPacket({
                    type: 'block',
                    x: placeX, y: placeY, z: placeZ,
                    id: blockToPlace
                });
            }
        }
    }

    checkPlayerCollision(x, y, z) {
        // Упрощенная проверка: блок не должен пересекаться с ногами или головой
        const px = Math.floor(this.position.x);
        const py = Math.floor(this.position.y);
        const pz = Math.floor(this.position.z);
        const ph = Math.floor(this.position.y + this.eyeHeight);
        
        return (x === px && z === pz && (y === py || y === ph));
    }
}
// 6. ВИЗУАЛИЗАЦИЯ ИГРОКА (Рука и анимации)
class PlayerHand {
    constructor() {
        this.group = new THREE.Group();
        
        // Создаем "кубическую" руку в стиле вокселей
        const handGeo = new THREE.BoxGeometry(0.25, 0.25, 0.6);
        const handMat = new THREE.MeshLambertMaterial({ color: 0xe0ac69 }); // Цвет кожи
        this.mesh = new THREE.Mesh(handGeo, handMat);
        
        // Позиционируем руку относительно камеры
        this.mesh.position.set(0.35, -0.4, -0.5);
        this.mesh.rotation.x = -0.2;
        this.group.add(this.mesh);
        camera.add(this.group);

        this.isAnimate = false;
        this.animTime = 0;
    }

    update(delta) {
        if (this.isAnimate) {
            this.animTime += delta * 15;
            // Движение руки вперед-назад (удар)
            this.mesh.position.z = -0.5 + Math.sin(this.animTime) * 0.2;
            this.mesh.rotation.x = -0.2 - Math.sin(this.animTime) * 0.5;

            if (this.animTime >= Math.PI) {
                this.isAnimate = false;
                this.animTime = 0;
                this.mesh.position.z = -0.5;
                this.mesh.rotation.x = -0.2;
            }
        } else {
            // Легкое покачивание при дыхании/ходьбе
            this.mesh.position.y = -0.4 + Math.sin(Date.now() * 0.003) * 0.01;
        }
    }

    playAction() {
        if (!this.isAnimate) this.isAnimate = true;
    }
}

// 7. ОБНОВЛЕНИЕ МИРА (InstancedMesh logic)
// Добавляем метод в класс World для динамического изменения блоков
World.prototype.setBlock = function(x, y, z, type, broadcast = true) {
    const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
    
    // Если блок тот же самый - ничего не делаем
    if (this.chunksData[key] === type) return;

    this.chunksData[key] = type;
    this.requestMeshUpdate(); // Помечаем, что меш нужно перерисовать

    // Эффект частиц при разрушении
    if (type === BLOCK_TYPES.AIR) {
        this.createBreakParticles(x, y, z);
    }
};

World.prototype.requestMeshUpdate = function() {
    // Чтобы не перегружать GPU, обновляем меши не каждый кадр, а через requestAnimationFrame
    if (this.updateQueued) return;
    this.updateQueued = true;

    setTimeout(() => {
        this.rebuildInstancedMeshes();
        this.updateQueued = false;
    }, 16); // Задержка в 1 кадр для батчинга изменений
};

World.prototype.rebuildInstancedMeshes = function() {
    // Удаляем старые меши из сцены
    Object.values(this.renderMeshes || {}).forEach(m => scene.remove(m));
    this.renderMeshes = {};

    const tempMatrix = new THREE.Matrix4();
    const blocksByType = {};

    // Группируем координаты всех блоков по их типам
    for (const [coords, type] of Object.entries(this.chunksData)) {
        if (type === BLOCK_TYPES.AIR) continue;
        if (!blocksByType[type]) blocksByType[type] = [];
        
        const [bx, by, bz] = coords.split(',').map(Number);
        blocksByType[type].push({x: bx, y: by, z: bz});
    }

    // Создаем по одному InstancedMesh на каждый тип блока
    for (const [type, positions] of Object.entries(blocksByType)) {
        const mat = this.getMaterialByType(type);
        const iMesh = new THREE.InstancedMesh(this.geometry, mat, positions.length);
        
        positions.forEach((pos, i) => {
            tempMatrix.setPosition(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5);
            iMesh.setMatrixAt(i, tempMatrix);
        });

        iMesh.instanceMatrix.needsUpdate = true;
        iMesh.castShadow = true;
        iMesh.receiveShadow = true;
        
        scene.add(iMesh);
        this.renderMeshes[type] = iMesh;
    }
};
// 8. КЛАСС СУЩНОСТЕЙ (Мобы)
class Mob {
    constructor(type, x, y, z) {
        this.type = type;
        this.position = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.speed = 0.04;
        this.health = 10;
        this.onGround = false;
        
        // Визуальная часть моба
        this.mesh = this.createMobMesh(type);
        scene.add(this.mesh);
    }

    createMobMesh(type) {
        const group = new THREE.Group();
        // Тело
        const bodyGeo = new THREE.BoxGeometry(0.6, 1.2, 0.4);
        const bodyMat = new THREE.MeshLambertMaterial({ color: type === 'zombie' ? 0x2e7d32 : 0x5d4037 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.6;
        
        // Голова
        const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.y = 1.45;
        
        group.add(body, head);
        return group;
    }

    update(delta, targetPlayer) {
        // 1. Простейший AI: Движение к игроку
        const dir = new THREE.Vector3()
            .subVectors(targetPlayer.position, this.position);
        dir.y = 0; // Игнорируем вертикаль для направления взгляда
        
        const distance = dir.length();
        
        if (distance < 15 && distance > 1.2) {
            dir.normalize();
            this.velocity.x = dir.x * this.speed;
            this.velocity.z = dir.z * this.speed;
            
            // Поворот меша в сторону игрока
            const targetRotation = Math.atan2(dir.x, dir.z);
            this.mesh.rotation.y = targetRotation;
        } else {
            this.velocity.x = 0;
            this.velocity.z = 0;
        }

        // 2. Гравитация
        if (!this.onGround) {
            this.velocity.y -= WORLD_CONFIG.GRAVITY * delta;
        }

        // 3. Прыжок при препятствии (Авто-степ)
        if (this.checkCollisionAhead(dir)) {
            if (this.onGround) {
                this.velocity.y = 0.15;
                this.onGround = false;
            }
        }

        // 4. Применение физики (используем тот же метод, что у игрока)
        this.applyMoveWithCollisions(this.velocity.x * delta, 'x');
        this.applyMoveWithCollisions(this.velocity.y * delta, 'y');
        this.applyMoveWithCollisions(this.velocity.z * delta, 'z');

        this.mesh.position.copy(this.position);

        // 5. Нанесение урона игроку
        if (distance <= 1.5 && Math.abs(this.position.y - targetPlayer.position.y) < 1) {
            this.attackPlayer();
        }
    }

    checkCollisionAhead(dir) {
        // Проверяем блок прямо перед собой на уровне ног
        const checkX = this.position.x + dir.x * 0.5;
        const checkY = this.position.y + 0.5;
        const checkZ = this.position.z + dir.z * 0.5;
        return world.getBlock(checkX, checkY, checkZ) !== BLOCK_TYPES.AIR;
    }

    applyMoveWithCollisions(amount, axis) {
        const oldPos = this.position[axis];
        this.position[axis] += amount;

        const radius = 0.3;
        const height = 1.8;
        let collision = false;

        // Быстрая проверка коллизий для моба
        const cx = this.position.x;
        const cy = this.position.y;
        const cz = this.position.z;

        if (world.getBlock(cx, cy, cz) !== BLOCK_TYPES.AIR) {
            collision = true;
        }

        if (collision) {
            if (axis === 'y') {
                if (amount < 0) this.onGround = true;
                this.velocity.y = 0;
            }
            this.position[axis] = oldPos;
        } else if (axis === 'y') {
            this.onGround = false;
        }
    }

    attackPlayer() {
        // Ограничение частоты атак (Cooldown)
        if (!this.lastAttack || Date.now() - this.lastAttack > 1000) {
            WebCraft.ui.updateHP(WebCraft.state.hp - 2); // Снимаем 1 сердце
            this.lastAttack = Date.now();
            console.log("Mob: Hit player!");
        }
    }
}
// 9. СЕТЕВАЯ ИНТЕРПОЛЯЦИЯ (Client Side)
const remotePlayers = new Map(); // ID -> Mesh
const remoteMobs = new Map();    // ID -> Mesh

WebCraft.core.processPacket = function(packet) {
    if (packet.type === 'sync') {
        // 1. Синхронизация других игроков
        packet.players.forEach(pData => {
            if (pData.id === WebCraft.network.id) return; // Пропускаем себя

            if (!remotePlayers.has(pData.id)) {
                // Создаем модель нового игрока, если его нет
                const playerMesh = createPlayerModel(pData.nick);
                scene.add(playerMesh);
                remotePlayers.set(pData.id, {
                    mesh: playerMesh,
                    targetPos: new THREE.Vector3(),
                    targetRot: 0
                });
            }

            const p = remotePlayers.get(pData.id);
            // Устанавливаем целевые координаты для плавной интерполяции (Lerp)
            p.targetPos.set(pData.pos.x, pData.pos.y, pData.pos.z);
            p.targetRot = pData.rot.y;
        });

        // 2. Синхронизация мобов (ЗОМБИ)
        packet.mobs.forEach(mData => {
            if (!remoteMobs.has(mData.id)) {
                const mob = new Mob(mData.type, mData.pos.x, mData.pos.y, mData.pos.z);
                remoteMobs.set(mData.id, mob);
            }
            
            const m = remoteMobs.get(mData.id);
            m.targetPos = new THREE.Vector3(mData.pos.x, mData.pos.y, mData.pos.z);
            m.targetRot = mData.rot;
        });
    }
};

// Функция плавного обновления (вызывается в animate)
function updateRemoteEntities(delta) {
    const lerpFactor = 0.15; // Коэффициент плавности (чем меньше, тем плавнее)

    // Плавно двигаем игроков
    remotePlayers.forEach(p => {
        p.mesh.position.lerp(p.targetPos, lerpFactor);
        p.mesh.rotation.y += (p.targetRot - p.mesh.rotation.y) * lerpFactor;
    });

    // Плавно двигаем мобов
    remoteMobs.forEach(m => {
        if (m.targetPos) {
            m.mesh.position.lerp(m.targetPos, lerpFactor);
            m.mesh.rotation.y += (m.targetRot - m.mesh.rotation.y) * lerpFactor;
        }
    });
}

function createPlayerModel(name) {
    const group = new THREE.Group();
    // Тело (Стив)
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 1.8, 0.4),
        new THREE.MeshLambertMaterial({ color: 0x00aaff })
    );
    body.position.y = 0.9;
    
    // Никнейм над головой (CSS2D или Sprite)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(name, 10, 30);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
    sprite.position.y = 2.1;
    sprite.scale.set(1, 0.5, 1);
    
    group.add(body, sprite);
    return group;
}

// 10. ГЛАВНЫЙ ИГРОВОЙ ЦИКЛ (The Heartbeat)
function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.1); // Ограничение лага

    if (!WebCraft.state.isMenuOpen && !WebCraft.state.isDead) {
        // Чтение ввода (Клавиатура или Джойстик)
        const input = getMovementInput(); 
        
        // Обновление игрока
        player.update(delta * 60, input);
        
        // Обновление руки (анимация)
        if (window.hand) window.hand.update(delta);

        // Интерполяция сетевых объектов
        updateRemoteEntities(delta);

        // Отправка своей позиции хосту (каждые 2 кадра для экономии)
        if (frameCount % 2 === 0) {
            WebCraft.network.sendPacket({
                type: 'pos_update',
                pos: player.position,
                rot: { y: player.rotation.y }
            });
        }
    }

    renderer.render(scene, camera);
    frameCount++;
}
// 11. СИСТЕМА ГОЛОДА И РЕГЕНЕРАЦИИ
function updateSurvivalStats(delta) {
    // Уменьшение голода при движении (каждые 30 секунд при беге)
    if (player.velocity.length() > 0.1 && !WebCraft.state.isMenuOpen) {
        WebCraft.state.hunger -= 0.001 * delta;
    }

    // Регенерация HP, если сыт (Hunger > 18)
    if (WebCraft.state.hunger > 18 && WebCraft.state.hp < 20) {
        WebCraft.state.hp += 0.005 * delta;
        WebCraft.ui.updateHP(WebCraft.state.hp);
    }

    // Урон от голода, если шкала пуста
    if (WebCraft.state.hunger <= 0) {
        WebCraft.state.hunger = 0;
        WebCraft.ui.updateHP(WebCraft.state.hp - 0.01 * delta);
    }
}

// 12. ЧАСТИЦЫ РАЗРУШЕНИЯ (VFX)
World.prototype.createBreakParticles = function(x, y, z) {
    const particleCount = 8;
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const material = new THREE.MeshLambertMaterial({ color: 0x6d4c41 });

    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(geometry, material);
        particle.position.set(x + 0.5, y + 0.5, z + 0.5);
        
        // Случайный импульс
        const vel = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            Math.random() * 0.2,
            (Math.random() - 0.5) * 0.1
        );

        scene.add(particle);

        // Анимация удаления
        gsap.to(particle.position, {
            x: particle.position.x + vel.x * 10,
            y: particle.position.y + vel.y * 10,
            z: particle.position.z + vel.z * 10,
            duration: 0.5,
            onComplete: () => scene.remove(particle)
        });
        gsap.to(particle.scale, { x: 0, y: 0, z: 0, duration: 0.5 });
    }
};

// 13. ОБРАБОТКА ВВОДА (Мобильный + ПК)
function getMovementInput() {
    const input = { up: false, down: false, left: false, right: false };
    
    // Клавиатура
    if (keys['w'] || keys['ц']) input.up = true;
    if (keys['s'] || keys['ы']) input.down = true;
    if (keys['a'] || keys['ф']) input.left = true;
    if (keys['d'] || keys['в']) input.right = true;

    // Джойстик (если отклонение больше порога)
    if (Math.abs(joystickData.y) > 0.2) {
        if (joystickData.y < 0) input.up = true;
        else input.down = true;
    }
    if (Math.abs(joystickData.x) > 0.2) {
        if (joystickData.x < 0) input.left = true;
        else input.right = true;
    }

    return input;
}

// Глобальные слушатели
const keys = {};
window.onkeydown = (e) => keys[e.key.toLowerCase()] = true;
window.onkeyup = (e) => keys[e.key.toLowerCase()] = false;

// Прыжок (Space или кнопка на экране)
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') player.jump();
});

document.getElementById('btn-jump').ontouchstart = () => player.jump();

// Взаимодействие (Мышь или Тач)
window.addEventListener('mousedown', (e) => {
    if (WebCraft.state.isMenuOpen) return;
    if (e.button === 0) player.interact(true);  // Левая кнопка - ломать
    if (e.button === 2) player.interact(false); // Правая кнопка - ставить
});

// Кнопки атаки и строительства для мобилок
document.getElementById('btn-attack').ontouchstart = () => player.interact(true);
document.getElementById('btn-build').ontouchstart = () => player.interact(false);

// Адаптация экрана
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 14. ФИНАЛЬНЫЙ ЗАПУСК
console.log("%c WebCraft Ultra Loaded! ", "background: #222; color: #bada55; font-size: 20px;");

// Авто-инициализация UI при старте
WebCraft.core.init();

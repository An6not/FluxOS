/**
 * WEBCRAFT ULTRA - MULTIPLAYER HOST CONTROLLER
 * Управление P2P сессией и синхронизацией мобов
 */

class GameHost {
    constructor() {
        this.clients = new Map(); // ID -> Данные игрока
        this.mobs = [];           // Список активных мобов на сервере
        this.syncInterval = null;
        this.init();
    }

    init() {
        console.log("Host: Starting authoritative server...");
        
        // Каждые 50мс рассылаем состояние мира (20 тиков в секунду)
        this.syncInterval = setInterval(() => this.broadcastGameState(), 50);
        
        // Создаем начальный пул мобов
        this.spawnInitialMobs();
    }

    spawnInitialMobs() {
        for (let i = 0; i < 5; i++) {
            const x = (Math.random() - 0.5) * 40;
            const z = (Math.random() - 0.5) * 40;
            const y = world.getHeight(x, z) + 2;
            
            const mob = new Mob('zombie', x, y, z);
            mob.id = 'mob_' + Math.random().toString(36).substr(2, 9);
            this.mobs.push(mob);
        }
    }

    addClient(conn, nickname) {
        console.log(`Host: Player ${nickname} joined.`);
        this.clients.set(conn.peer, {
            connection: conn,
            nick: nickname,
            pos: { x: 0, y: 0, z: 0 },
            rot: { y: 0 }
        });

        // Отправляем новому игроку текущее состояние мира (все блоки)
        this.sendWorldData(conn);
    }

    sendWorldData(conn) {
        // Сериализация только измененных блоков для экономии трафика
        const compressedWorld = world.serialize(); 
        conn.send({
            type: 'world_init',
            data: compressedWorld,
            seed: WORLD_CONFIG.SEED
        });
    }

    processClientPacket(peerId, packet) {
        const client = this.clients.get(peerId);
        if (!client) return;

        switch (packet.type) {
            case 'pos_update':
                client.pos = packet.pos;
                client.rot = packet.rot;
                break;
            case 'block_change':
                // Хост подтверждает изменение блока и рассылает всем
                world.setBlock(packet.x, packet.y, packet.z, packet.id, false);
                this.broadcast({
                    type: 'block_sync',
                    x: packet.x, y: packet.y, z: packet.z, id: packet.id
                }, peerId); // Исключаем отправителя
                break;
        }
    }

    broadcastGameState() {
        // Обновляем AI мобов на стороне хоста
        this.mobs.forEach(mob => {
            // Находим ближайшего игрока для преследования
            let closestPlayer = player; // Сам хост
            let minDist = mob.position.distanceTo(player.position);

            this.clients.forEach(c => {
                const d = mob.position.distanceTo(new THREE.Vector3(c.pos.x, c.pos.y, c.pos.z));
                if (d < minDist) {
                    minDist = d;
                    closestPlayer = c;
                }
            });

            mob.update(1, closestPlayer); // Тик AI
        });

        // Формируем пакет состояния
        const statePacket = {
            type: 'sync',
            players: Array.from(this.clients.entries()).map(([id, c]) => ({
                id, nick: c.nick, pos: c.pos, rot: c.rot
            })),
            mobs: this.mobs.map(m => ({
                id: m.id, pos: m.position, rot: m.mesh.rotation.y, type: m.type
            }))
        };

        this.broadcast(statePacket);
    }

    broadcast(data, excludePeer = null) {
        this.clients.forEach((client, id) => {
            if (id !== excludePeer && client.connection.open) {
                client.connection.send(data);
            }
        });
    }
}

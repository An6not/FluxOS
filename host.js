class HostSystem {
    constructor(roomName, password) {
        this.roomName = roomName;
        this.isAdmin = (password === "1488");
        this.players = [];
        
        this.initNetwork();
    }

    initNetwork() {
        console.log(`%c [HOST] Комната: ${this.roomName}`, "color: #00ff00; font-weight: bold;");
        if (this.isAdmin) {
            console.log("Права администратора подтверждены.");
        } else {
            console.log("Режим гостя.");
        }
    }

    // Заглушка для будущего WebRTC/Socket.io
    broadcast(data) {
        if (!this.isAdmin) return;
        // logic to send data to peers
    }
}

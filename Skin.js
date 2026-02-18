const Skin = {
    // Создание упрощенной модели игрока (будет видно в будущем при F5)
    createPlayerModel() {
        const group = new THREE.Group();
        const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        
        // Тело
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.4), material);
        body.position.y = 0.9;
        group.add(body);
        
        // Голова
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshLambertMaterial({ color: 0xffcc99 }));
        head.position.y = 2.0;
        group.add(head);
        
        return group;
    }
};

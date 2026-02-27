const SkinManager = {
    createSteve: () => {
        const group = new THREE.Group();
        const mat = new THREE.MeshLambertMaterial({ color: 0x3333ff });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.4), mat);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshLambertMaterial({color: 0xffdbac}));
        head.position.y = 0.8;
        group.add(body, head);
        return group;
    }
};

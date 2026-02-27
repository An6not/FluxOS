import * as THREE from 'three';

export const BLOCK_TYPES = { AIR: 0, GRASS: 1, DIRT: 2 };

export class TextureManager {
    constructor() {
        this.materials = {};
        this.init();
    }

    createTex(color, noise = 40) {
        const canvas = document.createElement('canvas');
        canvas.width = 16; canvas.height = 16;
        const ctx = canvas.getContext('2d');
        for(let x=0; x<16; x++) {
            for(let y=0; y<16; y++) {
                const v = (Math.random() - 0.5) * noise;
                ctx.fillStyle = `rgb(${color.r+v},${color.g+v},${color.b+v})`;
                ctx.fillRect(x,y,1,1);
            }
        }
        const t = new THREE.CanvasTexture(canvas);
        t.magFilter = t.minFilter = THREE.NearestFilter;
        return t;
    }

    init() {
        const dirt = this.createTex({r: 100, g: 60, b: 30}, 50);
        const grassTop = this.createTex({r: 80, g: 150, b: 50}, 30);
        
        const sideCanvas = document.createElement('canvas');
        sideCanvas.width = 16; sideCanvas.height = 16;
        const sCtx = sideCanvas.getContext('2d');
        sCtx.drawImage(dirt.image, 0, 0);
        sCtx.fillStyle = '#507d32';
        sCtx.fillRect(0,0,16,6); // Четкая шапка травы

        const grassSide = new THREE.CanvasTexture(sideCanvas);
        grassSide.magFilter = grassSide.minFilter = THREE.NearestFilter;

        const mDirt = new THREE.MeshLambertMaterial({map: dirt});
        const mGrassTop = new THREE.MeshLambertMaterial({map: grassTop});
        const mGrassSide = new THREE.MeshLambertMaterial({map: grassSide});

        this.materials[BLOCK_TYPES.DIRT] = Array(6).fill(mDirt);
        this.materials[BLOCK_TYPES.GRASS] = [mGrassSide, mGrassSide, mGrassTop, mDirt, mGrassSide, mGrassSide];
    }

    getMaterial(type) { return this.materials[type]; }
}

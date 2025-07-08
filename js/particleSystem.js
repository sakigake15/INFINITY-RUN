export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particleSystems = [];
        this.loader = new THREE.TextureLoader();
        
        // star_02.pngテクスチャを読み込み
        this.starTexture = this.loader.load('star_02.png');
    }

    createCoinParticles(position) {
        const particleCount = 15; // パーティクルの数
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const scales = new Float32Array(particleCount);

        // パーティクルの初期位置、速度、スケールを設定
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // 初期位置（コインの位置から少しランダムに散らす）
            positions[i3] = position.x + (Math.random() - 0.5) * 0.2;
            positions[i3 + 1] = position.y + (Math.random() - 0.5) * 0.2;
            positions[i3 + 2] = position.z + (Math.random() - 0.5) * 0.2;
            
            // 速度（上向きと放射状に）
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.02 + Math.random() * 0.03;
            velocities[i3] = Math.cos(angle) * speed;
            velocities[i3 + 1] = 0.05 + Math.random() * 0.05; // 上向きの速度
            velocities[i3 + 2] = Math.sin(angle) * speed;
            
            // スケール
            scales[i] = 0.1 + Math.random() * 0.1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

        // パーティクル用のマテリアル
        const material = new THREE.PointsMaterial({
            map: this.starTexture,
            transparent: true,
            alphaTest: 0.1,
            size: 0.3,
            sizeAttenuation: true,
            vertexColors: false,
            color: 0xffff00, // 金色
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);

        // パーティクルシステムオブジェクトを作成
        const particleSystem = {
            particles: particles,
            geometry: geometry,
            velocities: velocities,
            life: 0,
            maxLife: 60, // 1秒間（60フレーム）
            positions: positions,
            scales: scales,
            initialScales: [...scales] // 初期スケールを保存
        };

        this.particleSystems.push(particleSystem);
    }

    update() {
        const systemsToRemove = [];

        for (let i = 0; i < this.particleSystems.length; i++) {
            const system = this.particleSystems[i];
            system.life++;

            // ライフタイムが終了したシステムをマーク
            if (system.life >= system.maxLife) {
                systemsToRemove.push(i);
                continue;
            }

            // パーティクルの位置と透明度を更新
            const positions = system.positions;
            const velocities = system.velocities;
            const scales = system.scales;
            const initialScales = system.initialScales;
            const particleCount = positions.length / 3;
            
            const lifeRatio = system.life / system.maxLife;
            const alpha = 1.0 - lifeRatio; // 時間経過とともに透明になる
            
            for (let j = 0; j < particleCount; j++) {
                const j3 = j * 3;
                
                // 位置を更新
                positions[j3] += velocities[j3];
                positions[j3 + 1] += velocities[j3 + 1];
                positions[j3 + 2] += velocities[j3 + 2];
                
                // 重力を適用
                velocities[j3 + 1] -= 0.002;
                
                // スケールを時間とともに小さくする
                scales[j] = initialScales[j] * (1.0 - lifeRatio * 0.5);
            }

            // バッファを更新
            system.geometry.attributes.position.needsUpdate = true;
            system.geometry.attributes.scale.needsUpdate = true;
            
            // マテリアルの透明度を更新
            system.particles.material.opacity = alpha;
        }

        // 終了したパーティクルシステムを削除
        for (let i = systemsToRemove.length - 1; i >= 0; i--) {
            const index = systemsToRemove[i];
            const system = this.particleSystems[index];
            
            this.scene.remove(system.particles);
            system.geometry.dispose();
            system.particles.material.dispose();
            
            this.particleSystems.splice(index, 1);
        }
    }

    dispose() {
        // 全てのパーティクルシステムを削除
        for (const system of this.particleSystems) {
            this.scene.remove(system.particles);
            system.geometry.dispose();
            system.particles.material.dispose();
        }
        this.particleSystems = [];
        
        // テクスチャを削除
        if (this.starTexture) {
            this.starTexture.dispose();
        }
    }
}

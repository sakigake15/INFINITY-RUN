export class Player {
    constructor(scene, modelPath) {
        this.scene = scene;
        this.modelPath = modelPath;
        this.player = null;
        this.mixer = null;
        this.runningAction = null;
        this.clock = new THREE.Clock();
        this.onLoad = null;

        this.loadModel();
    }

    loadModel() {
        const loader = new THREE.GLTFLoader();
        loader.load(
            this.modelPath,
            (gltf) => {
                this.player = gltf.scene;
                this.player.scale.set(0.5, 0.5, 0.5);
                this.player.position.set(0, 0.3, 0);
                this.player.rotation.y = Math.PI;
                this.scene.add(this.player);

                // アニメーションの設定
                this.mixer = new THREE.AnimationMixer(this.player);
                const animations = gltf.animations;
                
                // Running_Aアニメーションを検索して設定
                const runningAnimation = animations.find(anim => anim.name === 'Running_A');
                if (runningAnimation) {
                    this.runningAction = this.mixer.clipAction(runningAnimation);
                    this.runningAction.setLoop(THREE.LoopRepeat);
                    this.runningAction.play();
                }

                // モデルの読み込みが完了したらコールバックを実行
                if (this.onLoad) {
                    this.onLoad();
                }
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('GLTFLoader error:', error);
            }
        );
    }

    resetPosition() {
        if (this.player) {
            this.player.position.set(0, 0.3, 0);
            
            // プレイヤーの色をリセット
            this.player.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            if (mat.originalColor) {
                                mat.emissive.set(0, 0, 0);
                            }
                        });
                    } else if (child.material.originalColor) {
                        child.material.emissive.set(0, 0, 0);
                    }
                }
            });
        }
    }

    update() {
        if (this.mixer) {
            this.mixer.update(this.clock.getDelta());
        }
        
        // プレイヤーを奥に移動
        if (this.player) {
            this.player.position.z -= 0.1;
        }
    }

    startRunning() {
        if (this.runningAction) {
            this.runningAction.reset();
            this.runningAction.play();
        }
    }

    stopRunning() {
        if (this.runningAction) {
            this.runningAction.stop();
        }
    }

    getModel() {
        return this.player;
    }

    getMixer() {
        return this.mixer;
    }

    getRunningAction() {
        return this.runningAction;
    }
}

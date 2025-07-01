export class SceneManager {
    constructor(gameState) {
        this.loader = new THREE.GLTFLoader();
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.gameState = gameState;
        this.renderer = null;
        this.laneWidth = 1.5;
        this.laneLength = 20;
        this.cameraSpeed = 0.15;
        this.lanes = []; // レーンタイルを管理する配列
        this.tileLength = 2; // 1つのタイルの長さ
        this.grounds = []; // 地面を管理する配列
        
        // 照明オブジェクトを保持
        this.ambientLight = null;
        this.directionalLight = null;

        this.setupScene();
        this.setupLighting();
        this.setupGround();
        this.setupLanes();
        this.setupRenderer();
        this.setupCamera();
        this.setupResizeHandler();
    }

    setupScene() {
        this.scene.background = new THREE.Color(0x87CEEB); // 空色の背景
    }

    setupLighting() {
        // 環境光
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(this.ambientLight);

        // 指向光
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(5, 5, 5);
        this.scene.add(this.directionalLight);
    }

    setupGround() {
        // 初期の地面を生成
        this.addGroundTile(0);
    }

    addGroundTile(z) {
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01;
        ground.position.z = z;
        this.scene.add(ground);
        this.grounds.push(ground);
    }

    setupLanes() {
        const laneModel = 'tileBrickA_large.gltf.glb';
        const tilesNeeded = Math.ceil(this.laneLength / this.tileLength);

        this.loader.load(laneModel, (gltf) => {
            const template = gltf.scene;
            // 各レーンにタイルを敷き詰める
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < tilesNeeded; j++) {
                    const lane = template.clone();
                    lane.position.x = (i === 0 ? -1 : 1);
                    lane.position.y = -1;
                    lane.position.z = -(j * this.tileLength);
                    lane.rotation.y = 0;
                    lane.scale.set(0.75, 1, 1);
                    this.scene.add(lane);
                    this.lanes.push(lane);
                }
            }
        });
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    setupCamera() {
        this.camera.position.set(0, 3, 4);
        this.camera.rotation.x = -Math.PI / 6;
    }

    reset() {
        // カメラをリセット
        this.camera.position.set(0, 3, 4);
        this.camera.rotation.x = -Math.PI / 6;

        // レーンをクリア
        this.lanes.forEach(lane => {
            this.scene.remove(lane);
        });
        this.lanes = [];

        // 地面をクリア
        this.grounds.forEach(ground => {
            this.scene.remove(ground);
        });
        this.grounds = [];

        // 初期のレーンと地面を再生成
        this.setupGround();
        this.setupLanes();
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    addNewLaneTile(x, z) {
        const laneModel = 'tileBrickA_large.gltf.glb';
        this.loader.load(laneModel, (gltf) => {
            const lane = gltf.scene;
            lane.position.x = x;
            lane.position.y = -1;
            lane.position.z = z;
            lane.rotation.y = 0;
            lane.scale.set(0.75, 1, 1);
            this.scene.add(lane);
            this.lanes.push(lane);
        });
    }

    update() {
        if (this.camera && this.gameState.isGameStarted && !this.gameState.isGameOver) {
            // カメラを奥に移動
            this.camera.position.z -= this.cameraSpeed;
            
            // 地獄世界でない場合のみlookAtを実行（地獄世界では回転を維持）
            if (!this.gameState.getIsHellWorld()) {
                // プレイヤーの視点を維持するため、カメラの注視点も移動
                this.camera.lookAt(0, 0, this.camera.position.z - 4);
            }

            // レーンと地面の管理
            if (this.lanes.length > 0) {
                // 1. フレームアウトしたレーンと地面の削除
                const removeLanes = [];
                this.lanes.forEach(lane => {
                    if (lane.position.z > this.camera.position.z + 5) {
                        removeLanes.push(lane);
                    }
                });
                removeLanes.forEach(lane => {
                    this.scene.remove(lane);
                    this.lanes.splice(this.lanes.indexOf(lane), 1);
                });

                const removeGrounds = [];
                this.grounds.forEach(ground => {
                    if (ground.position.z > this.camera.position.z + 25) {
                        removeGrounds.push(ground);
                    }
                });
                removeGrounds.forEach(ground => {
                    this.scene.remove(ground);
                    this.grounds.splice(this.grounds.indexOf(ground), 1);
                });

                // 2. 新しいレーンと地面の追加
                const lastLane = this.lanes.reduce((prev, current) => 
                    (current.position.z < prev.position.z) ? current : prev
                );
                if (lastLane && lastLane.position.z > this.camera.position.z - 30) {
                    this.addNewLaneTile(-1, lastLane.position.z - this.tileLength);
                    this.addNewLaneTile(1, lastLane.position.z - this.tileLength);
                }

                const lastGround = this.grounds.reduce((prev, current) => 
                    (current.position.z < prev.position.z) ? current : prev
                );
                if (lastGround && lastGround.position.z > this.camera.position.z - 50) {
                    this.addGroundTile(lastGround.position.z - 50);
                }
            }
        }
    }

    render() {
        this.update();
        this.renderer.render(this.scene, this.camera);
    }

    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }

    getRenderer() {
        return this.renderer;
    }

    getLaneWidth() {
        return this.laneWidth;
    }

    // 地獄世界への切り替え
    toggleWorld() {
        if (this.gameState.getIsHellWorld()) {
            // 地獄世界に切り替え
            this.switchToHellWorld();
        } else {
            // 地上世界に切り替え
            this.switchToEarthWorld();
        }
    }

    switchToHellWorld() {
        // 背景を暗い赤に変更
        this.scene.background = new THREE.Color(0x400000); // 暗い赤
        
        // 照明を赤く変更（透明度70%）
        this.ambientLight.color.setHex(0xff4444);
        this.ambientLight.intensity = 0.35; // 70%の透明度（0.5 * 0.7 = 0.35）
        this.directionalLight.color.setHex(0xff0000);
        this.directionalLight.intensity = 0.56; // 70%の透明度（0.8 * 0.7 = 0.56）
        
        // カメラをz軸180度回転
        this.camera.rotation.z = Math.PI;
    }

    switchToEarthWorld() {
        // 背景を空色に戻す
        this.scene.background = new THREE.Color(0x87CEEB);
        
        // 照明を白に戻す（元の強度に戻す）
        this.ambientLight.color.setHex(0xffffff);
        this.ambientLight.intensity = 0.5; // 元の強度
        this.directionalLight.color.setHex(0xffffff);
        this.directionalLight.intensity = 0.8; // 元の強度
        
        // カメラの回転をリセット
        this.camera.rotation.z = 0;
    }
}

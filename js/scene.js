export class SceneManager {
    constructor() {
        this.loader = new THREE.GLTFLoader();
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = null;
        this.laneWidth = 1.5;
        this.laneLength = 20;
        this.cameraSpeed = 0.15;
        this.lanes = []; // レーンタイルを管理する配列
        this.tileLength = 2; // 1つのタイルの長さ
        this.grounds = []; // 地面を管理する配列

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
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // 指向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);
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
        if (this.camera) {
            // カメラを奥に移動
            this.camera.position.z -= this.cameraSpeed;
            // プレイヤーの視点を維持するため、カメラの注視点も移動
            this.camera.lookAt(0, 0, this.camera.position.z - 4);

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
}

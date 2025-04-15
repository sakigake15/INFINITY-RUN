export class SceneManager {
    constructor() {
        this.loader = new THREE.GLTFLoader();
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = null;
        this.laneWidth = 1.5;
        this.laneLength = 20;

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
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01;
        this.scene.add(ground);
    }

    setupLanes() {
        const laneModel = 'tileBrickA_large.gltf.glb';
        const tileLength = 2; // 1つのタイルの長さ
        const tilesNeeded = Math.ceil(this.laneLength / tileLength); // 必要なタイルの数

        for (let i = 0; i < 2; i++) {
            this.loader.load(laneModel, (gltf) => {
                // 各レーンにタイルを敷き詰める
                for (let j = 0; j < tilesNeeded; j++) {
                    const lane = gltf.scene.clone();
                    lane.position.x = (i === 0 ? -1 : 1);
                    lane.position.y = -1;
                    lane.position.z = -(j * tileLength);
                    lane.rotation.y = 0;
                    
                    // 横幅を広げて配置
                    lane.scale.set(0.75, 1, 1);
                    
                    this.scene.add(lane);
                }
            });
        }
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

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    render() {
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

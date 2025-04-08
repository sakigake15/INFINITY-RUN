export class SceneManager {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = null;
        this.laneWidth = 2;
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
        const laneGeometry = new THREE.PlaneGeometry(this.laneWidth, this.laneLength);
        const laneMaterials = [
            new THREE.MeshPhongMaterial({ color: 0x66ff66 }), // 左レーン: 緑
            new THREE.MeshPhongMaterial({ color: 0x6666ff }), // 中央レーン: 青
            new THREE.MeshPhongMaterial({ color: 0xff6666 }), // 右レーン: 赤
        ];

        for (let i = 0; i < 3; i++) {
            const lane = new THREE.Mesh(laneGeometry, laneMaterials[i]);
            lane.position.x = (i - 1) * this.laneWidth;
            lane.position.y = 0;
            lane.position.z = -this.laneLength / 2;
            lane.rotation.x = -Math.PI / 2;
            this.scene.add(lane);
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

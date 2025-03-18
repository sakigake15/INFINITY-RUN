// Three.jsの基本的なセットアップ
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // 空色の背景

// 背景の地面
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 }); // 森林緑
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.01; // レーンのほんの少し下に配置
scene.add(ground);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// レーンの作成
const laneWidth = 2;
const laneLength = 20;
const laneGeometry = new THREE.PlaneGeometry(laneWidth, laneLength);

// レーンのマテリアル
const laneMaterials = [
    new THREE.MeshPhongMaterial({ color: 0x66ff66 }), // 左レーン: 緑
    new THREE.MeshPhongMaterial({ color: 0x6666ff }), // 中央レーン: 青
    new THREE.MeshPhongMaterial({ color: 0xff6666 }), // 右レーン: 赤
];

// ライトの設定
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // 環境光
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // 指向光
directionalLight.position.set(5, 5, 5); // 右上から光を当てる
scene.add(directionalLight);

// レーンの作成と配置
const lanes = [];
for (let i = 0; i < 3; i++) {
    const lane = new THREE.Mesh(laneGeometry, laneMaterials[i]);
    lane.position.x = (i - 1) * laneWidth; // 中央のレーンを基準に左右に配置
    lane.position.y = 0; // レーンを地面と同じ高さに設定
    lane.position.z = -laneLength / 2; // レーンを奥に延びるように配置
    lane.rotation.x = -Math.PI / 2; // 水平に寝かせる
    lanes.push(lane);
    scene.add(lane);
}
const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('game'),
    antialias: true
});

// レンダラーの初期設定
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// カメラの位置とアングルの設定
camera.position.set(0, 10, 15); // より高く、より後ろに
camera.rotation.x = -Math.PI / 4; // 45度下向き

// ウィンドウリサイズ対応
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// レンダリングループ
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// アニメーションの開始
animate();

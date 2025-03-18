// Three.jsの基本的なセットアップ
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('game'),
    antialias: true
});

// レンダラーの初期設定
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// カメラの初期位置
camera.position.z = 5;

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

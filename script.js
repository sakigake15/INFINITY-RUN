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
camera.position.set(0, 3, 4); // 高さを3に調整
camera.rotation.x = -Math.PI / 6; // 30度下向きに調整

// ウィンドウリサイズ対応
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// プレイヤーキャラクターと障害物の読み込み
const loader = new THREE.GLTFLoader();
let player;
let obstacle;


loader.load(
    'Rogue.glb',
    function (gltf) {
        player = gltf.scene;
        player.scale.set(0.5, 0.5, 0.5); // モデルのサイズ調整
        player.position.set(0, 0.3, 0); // レーンの上に配置（適度な高さで）
        player.rotation.y = Math.PI; // キャラクターを前向きに
        scene.add(player);
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('GLTFLoader error:', error);
    }
);

// デバイスタイプの検出
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// キャラクター移動の制御
const moveSpeed = 0.2; // 移動速度
let currentLane = 1; // 0: 左, 1: 中央, 2: 右
let targetX = 0; // 目標のX座標
let touchStartX = 0; // タッチ開始位置

// PC: キーボード入力の処理
if (!isMobile) {
    window.addEventListener('keydown', (event) => {
    if (!player) return; // プレイヤーがロードされていない場合は無視

    switch(event.key) {
        case 'ArrowLeft':
            if (currentLane > 0) {
                currentLane--;
                targetX = (currentLane - 1) * laneWidth;
            }
            break;
        case 'ArrowRight':
            if (currentLane < 2) {
                currentLane++;
                targetX = (currentLane - 1) * laneWidth;
            }
            break;
    }
    });
}

// スマートフォン: タッチ操作の処理
if (isMobile) {
    window.addEventListener('touchstart', (event) => {
        touchStartX = event.touches[0].clientX;
    });

    window.addEventListener('touchend', (event) => {
        if (!player) return;

        const touchEndX = event.changedTouches[0].clientX;
        const swipeDistance = touchEndX - touchStartX;

        if (Math.abs(swipeDistance) > 50) { // 50px以上のスワイプで方向転換
            if (swipeDistance < 0 && currentLane > 0) { // 左スワイプ
                currentLane--;
                targetX = (currentLane - 1) * laneWidth;
            } else if (swipeDistance > 0 && currentLane < 2) { // 右スワイプ
                currentLane++;
                targetX = (currentLane - 1) * laneWidth;
            }
        }
    });
}

// スムーズな移動の処理
function updatePlayerPosition() {
    if (player) {
        // 現在のX座標と目標のX座標の差を計算
        const diff = targetX - player.position.x;
        if (Math.abs(diff) > 0.01) {
            // 目標に向かってスムーズに移動
            player.position.x += diff * moveSpeed;
        }
    }
}

// 障害物の設定
const obstacleSpeed = 0.1;
const minSpawnInterval = 2000; // 最小生成間隔（ミリ秒）
const maxSpawnInterval = 4000; // 最大生成間隔（ミリ秒）

// 障害物の生成
function spawnObstacle() {
    // 既存の障害物が画面外に出ているか、存在しない場合のみ新しい障害物を生成
    if (!obstacle) {
        loader.load(
            'barrel_small.gltf',
            function (gltf) {
                obstacle = gltf.scene;
                obstacle.scale.set(1.0, 1.0, 1.0);
                
                // ランダムなレーンを選択（0, 1, 2）
                const randomLane = Math.floor(Math.random() * 3);
                const xPosition = (randomLane - 1) * laneWidth;
                
                obstacle.position.set(xPosition, 0, -15);
                scene.add(obstacle);
                
                // 次の障害物生成までの時間をランダムに設定
                const nextSpawnTime = minSpawnInterval + Math.random() * (maxSpawnInterval - minSpawnInterval);
                setTimeout(spawnObstacle, nextSpawnTime);
            },
            null,
            function (error) {
                console.error('GLTFLoader error:', error);
            }
        );
    } else {
        // 既存の障害物がある場合は、少し待ってから再試行
        setTimeout(spawnObstacle, 1000);
    }
}

// 障害物の移動処理
function updateObstaclePosition() {
    if (obstacle) {
        obstacle.position.z += obstacleSpeed; // 手前に移動
        
        // 画面外に出たら削除
        if (obstacle.position.z > 2) {
            scene.remove(obstacle);
            obstacle = null;
        }
    }
}

// レンダリングループ
function animate() {
    requestAnimationFrame(animate);
    updatePlayerPosition(); // プレイヤーの位置更新
    updateObstaclePosition(); // 障害物の位置更新
    renderer.render(scene, camera);
}

// アニメーションの開始
animate();

// 最初の障害物生成を開始
spawnObstacle();

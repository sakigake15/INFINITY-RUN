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

// ゲーム状態の管理
let isGameOver = false;
let isGameStarted = false;
let obstacleSpawnTimeout;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;

// ハイスコアの更新
function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    document.getElementById('highScore').textContent = highScore;
}

// ゲームの開始
function startGame() {
    isGameStarted = true;
    isGameOver = false;
    document.getElementById('titleScreen').classList.add('hidden');
    document.getElementById('scoreDisplay').classList.remove('hidden');
    document.getElementById('scoreDisplay').style.animation = 'fadeIn 0.5s ease forwards';
    spawnObstacle();
    
    if (runningAction) {
        runningAction.reset();
        runningAction.play();
    }
}

// タイトルに戻る
function backToTitle() {
    resetGame();
}

// スコアの初期化
function initScore() {
    score = 0;
    document.getElementById('currentScore').textContent = '0';
    document.getElementById('finalScore').textContent = '0';
    document.getElementById('scoreDisplay').classList.add('hidden');
}

// プレイヤーキャラクターと障害物の読み込み
const loader = new THREE.GLTFLoader();
let player;
let obstacle;
let mixer;
let runningAction;
const clock = new THREE.Clock();

loader.load(
    'Rogue.glb',
    function (gltf) {
        player = gltf.scene;
        player.scale.set(0.5, 0.5, 0.5); // モデルのサイズ調整
        player.position.set(0, 0.3, 0); // レーンの上に配置（適度な高さで）
        player.rotation.y = Math.PI; // キャラクターを前向きに
        scene.add(player);

        // アニメーションの設定
        mixer = new THREE.AnimationMixer(player);
        const animations = gltf.animations;
        
        // Running_Aアニメーションを検索して設定
        const runningAnimation = animations.find(anim => anim.name === 'Running_A');
        if (runningAnimation) {
            runningAction = mixer.clipAction(runningAnimation);
            runningAction.setLoop(THREE.LoopRepeat); // 無限ループ設定
            runningAction.play();
        }
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
        if (!player || isGameOver || !isGameStarted) return;

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
        if (!player || isGameOver || !isGameStarted) return;

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
let obstacleSpeed = 0.1;
const minSpawnInterval = 2000; // 最小生成間隔（ミリ秒）
const maxSpawnInterval = 4000; // 最大生成間隔（ミリ秒）

// 衝突判定
function checkCollision() {
    if (!player || !obstacle || isGameOver) return false;
    
    // プレイヤーと障害物の距離を計算
    const dx = player.position.x - obstacle.position.x;
    const dz = player.position.z - obstacle.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    // 衝突判定の閾値（キャラクターと障害物のサイズを考慮して調整）
    const collisionThreshold = 1.0;
    
    return distance < collisionThreshold;
}

// ゲーム状態のリセット
function resetGame() {
    isGameOver = false;
    isGameStarted = false;
    obstacleSpeed = 0.1;
    currentLane = 1;
    targetX = 0;
    initScore();

    // プレイヤーの位置をリセット
    if (player) {
        player.position.set(0, 0.3, 0);
        
        // プレイヤーの色をリセット
        player.traverse((child) => {
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

    // 障害物を削除
    if (obstacle) {
        scene.remove(obstacle);
        obstacle = null;
    }

    // ゲームオーバー画面を非表示にしてタイトル画面を表示
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('titleScreen').classList.remove('hidden');
}

// ゲームオーバー処理
function handleGameOver() {
    isGameOver = true;
    console.log("ゲームオーバー");

    // プレイヤーモデルの全マテリアルを赤く変更
    player.traverse((child) => {
        if (child.isMesh && child.material) {
            // 配列の場合は各マテリアルを処理
            if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                    mat.originalColor = mat.color.clone();
                    mat.emissive = new THREE.Color(0xff0000);
                });
            } else {
                // 単一のマテリアルの場合
                child.material.originalColor = child.material.color.clone();
                child.material.emissive = new THREE.Color(0xff0000);
            }
        }
    });

    // アニメーションを停止
    if (runningAction) {
        runningAction.stop();
    }

    // 障害物の生成と移動を停止
    obstacleSpeed = 0;
    if (obstacleSpawnTimeout) {
        clearTimeout(obstacleSpawnTimeout);
    }

    // スコアを更新してゲームオーバー画面を表示
    updateHighScore();
    document.getElementById('finalScore').textContent = score;
    const gameOverScreen = document.getElementById('gameOverScreen');
    gameOverScreen.classList.remove('hidden');
}

// ボタンのイベントリスナーを設定
document.getElementById('retryButton').addEventListener('click', resetGame);
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('titleButton').addEventListener('click', backToTitle);

// ハイスコアの初期表示
document.getElementById('highScore').textContent = highScore;

// 障害物の生成
function spawnObstacle() {
    if (isGameOver || !isGameStarted) return;

    // 既存の障害物が画面外に出ているか、存在しない場合のみ新しい障害物を生成
    if (!obstacle) {
        loader.load(
            'barrel_small.gltf',
            function (gltf) {
                if (isGameOver || !isGameStarted) return;
                
                obstacle = gltf.scene;
                obstacle.scale.set(1.0, 1.0, 1.0);
                
                // ランダムなレーンを選択（0, 1, 2）
                const randomLane = Math.floor(Math.random() * 3);
                const xPosition = (randomLane - 1) * laneWidth;
                
                obstacle.position.set(xPosition, 0, -15);
                scene.add(obstacle);
                
                // 次の障害物生成までの時間をランダムに設定
                const nextSpawnTime = minSpawnInterval + Math.random() * (maxSpawnInterval - minSpawnInterval);
                obstacleSpawnTimeout = setTimeout(spawnObstacle, nextSpawnTime);
            },
            null,
            function (error) {
                console.error('GLTFLoader error:', error);
            }
        );
    } else {
        // 既存の障害物がある場合は、少し待ってから再試行
        obstacleSpawnTimeout = setTimeout(spawnObstacle, 1000);
    }
}

// 障害物の移動処理
function updateObstaclePosition() {
    if (obstacle && !isGameOver && isGameStarted) {
        obstacle.position.z += obstacleSpeed; // 手前に移動
        
        // 衝突判定
        if (checkCollision()) {
            handleGameOver();
            return;
        }
        
        // 画面外に出たら削除し、スコアを加算
        if (obstacle.position.z > 2) {
            score += 100; // 障害物1つにつき100点
            document.getElementById('currentScore').textContent = score;
            scene.remove(obstacle);
            obstacle = null;
            
            // 難易度を少しずつ上げる
            obstacleSpeed = Math.min(obstacleSpeed + 0.005, 0.2); // 最大速度0.2まで
        }
    }
}

// レンダリングループ
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    
    if (!isGameOver && isGameStarted) {
        updatePlayerPosition(); // プレイヤーの位置更新
        updateObstaclePosition(); // 障害物の位置更新
    }
    
    if (mixer) {
        mixer.update(delta);
    }
    
    renderer.render(scene, camera);
}

// アニメーションの開始
animate();

// 初期化
initScore();

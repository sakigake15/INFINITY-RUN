export class ObstacleManager {
    constructor(scene, gameState, player, laneWidth) {
        this.scene = scene;
        this.gameState = gameState;
        this.player = player;
        this.laneWidth = laneWidth;
        this.obstacles = [];
        this.coins = [];
        this.loader = new THREE.GLTFLoader();
        
        // 障害物のモデルパスを配列で保持
        this.obstacleModels = [
            {path: 'barrel_small.gltf', scale: 1.0},
            {path: 'detail_rocks_small.gltf.glb', scale: 2.0},
            {path: 'detail_treeC.gltf.glb', scale: 2.0}
        ];
        
        this.spawnInterval = 300; // 生成間隔（0.3秒）
        this.spawnTimer = null;
        this.obstacleCountdown = 0; // 障害物生成までのカウントダウン
        this.coinSpawnDistance = 5; // コインを生成する間隔（マス目単位）
        this.lastCoinZ = 0; // 最後にコインを生成したZ座標
    }

    startSpawning() {
        if (this.spawnTimer) return;
        this.spawnObjects();
        this.spawnTimer = setInterval(() => this.spawnObjects(), this.spawnInterval);
    }

    stopSpawning() {
        if (this.spawnTimer) {
            clearInterval(this.spawnTimer);
            this.spawnTimer = null;
        }
    }

    spawnObjects() {
        if (this.gameState.isGameOver || !this.gameState.isGameStarted) return;

        // プレイヤーの現在位置を取得
        const playerZ = this.player.getModel().position.z;

        // 5マスごとにコインを生成
        if (Math.abs(playerZ - this.lastCoinZ) >= this.coinSpawnDistance) {
            const coinLane = Math.floor(Math.random() * 3);
            const coinXPosition = (coinLane - 1) * this.laneWidth;
            const coinZPosition = playerZ - 15; // プレイヤーの15マス先に生成

            // コインの生成
            this.loader.load(
                'Coin_A.gltf',
                (gltf) => {
                    if (this.gameState.isGameOver || !this.gameState.isGameStarted) return;
                    
                    const coin = gltf.scene;
                    coin.scale.set(0.5, 0.5, 0.5);
                    const newCoin = coin.clone();
                    newCoin.position.set(coinXPosition, 0.5, coinZPosition);
                    this.scene.add(newCoin);
                    this.coins.push(newCoin);
                    this.lastCoinZ = playerZ;
                },
                null,
                (error) => {
                    console.error('GLTFLoader error:', error);
                }
            );
        }

        if (this.obstacleCountdown === 0) {
            // 障害物のレーンをランダムに選択
            const obstacleLane = Math.floor(Math.random() * 3);
            const obstacleXPosition = (obstacleLane - 1) * this.laneWidth;
            const obstacleZPosition = playerZ - 15; // プレイヤーの15マス先に生成

            // 障害物の生成
            const randomModel = this.obstacleModels[Math.floor(Math.random() * this.obstacleModels.length)];
            this.loader.load(
                randomModel.path,
                (gltf) => {
                    if (this.gameState.isGameOver || !this.gameState.isGameStarted) return;
                    
                    const newObstacle = gltf.scene;
                    newObstacle.scale.set(randomModel.scale, randomModel.scale, randomModel.scale);
                    newObstacle.position.set(obstacleXPosition, 0, obstacleZPosition);
                    this.scene.add(newObstacle);
                    this.obstacles.push(newObstacle);
                },
                null,
                (error) => {
                    console.error('GLTFLoader error:', error);
                }
            );

            // 次の障害物までのカウントダウンをセット（0, 1, 2のいずれか）
            this.obstacleCountdown = Math.floor(Math.random() * 3);
        } else {
            this.obstacleCountdown--;
        }
    }

    checkCollision() {
        if (!this.player.getModel() || this.gameState.isGameOver) return false;
        
        const playerModel = this.player.getModel();
        for (const obstacle of this.obstacles) {
            const dx = playerModel.position.x - obstacle.position.x;
            const dz = playerModel.position.z - obstacle.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < 1.0) {
                return true;
            }
        }
        return false;
    }

    checkCoinCollision(coin) {
        if (!this.player.getModel()) return false;
        
        const playerModel = this.player.getModel();
        const dx = playerModel.position.x - coin.position.x;
        const dz = playerModel.position.z - coin.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        return distance < 0.8;
    }

    update() {
        if (this.gameState.isGameOver || !this.gameState.isGameStarted) return;

        const removeObstacles = [];
        const removeCoins = [];

        // 障害物の更新
        for (const obstacle of this.obstacles) {
            // 障害物は固定位置
            if (obstacle.position.z > this.player.getModel().position.z + 5) {
                this.gameState.addScore(100);
                removeObstacles.push(obstacle);
            }
        }

        // コインの更新
        for (const coin of this.coins) {
            // コインは固定位置
            coin.rotation.y += 0.05;

            if (this.checkCoinCollision(coin)) {
                this.gameState.addMoney(10);
                removeCoins.push(coin);
            }
            
            if (coin.position.z > this.player.getModel().position.z + 5) {
                removeCoins.push(coin);
            }
        }

        // 削除処理
        for (const obstacle of removeObstacles) {
            this.scene.remove(obstacle);
            this.obstacles.splice(this.obstacles.indexOf(obstacle), 1);
        }
        
        for (const coin of removeCoins) {
            this.scene.remove(coin);
            this.coins.splice(this.coins.indexOf(coin), 1);
        }

        // 衝突判定
        if (this.checkCollision()) {
            this.gameState.handleGameOver(
                this.player.getModel(),
                this.player.getRunningAction()
            );
        }
    }

    reset() {
        // 全ての障害物とコインを削除
        for (const obstacle of this.obstacles) {
            this.scene.remove(obstacle);
        }
        this.obstacles = [];

        for (const coin of this.coins) {
            this.scene.remove(coin);
        }
        this.coins = [];
        
        // コインの生成を停止
        this.stopSpawning();
        // 最後のコイン位置をリセット
        this.lastCoinZ = 0;
    }
}

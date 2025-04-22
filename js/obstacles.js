export class ObstacleManager {
    constructor(scene, gameState, player, laneWidth) {
        this.scene = scene;
        this.gameState = gameState;
        this.player = player;
        this.laneWidth = laneWidth;
        this.obstacles = [];
        this.coins = [];
        this.potionChance = 0.01; // 1%の確率でポーションに変化
        this.isFeverTime = false; // フィーバータイムの状態
        this.feverTimeTimer = null; // フィーバータイムのタイマー
        this.loader = new THREE.GLTFLoader();
        
        // 障害物のモデルパスを配列で保持
        this.obstacleModels = [
            {path: 'barrel_small.gltf', scale: 1.0},
            {path: 'detail_rocks_small.gltf.glb', scale: 2.0},
            {path: 'detail_treeC.gltf.glb', scale: 2.0}
        ];
        
        this.spawnInterval = 300; // 生成間隔（0.3秒）
        this.spawnTimer = null;
        this.lastCoinZ = 0; // 最後にコインを生成したZ座標
        this.lastObstacleZ = 0; // 最後に障害物を生成したZ座標
        this.coinSpawnDistance = 3; // コインを生成する間隔（3マス置き）
        this.obstacleChance = 0.15; // 障害物生成確率（15%）
        this.currentCoinLane = -1;
        this.lastObstacleLane = -1;
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

    startFeverTime() {
        this.isFeverTime = true;
        if (this.feverTimeTimer) {
            clearTimeout(this.feverTimeTimer);
        }
        this.feverTimeTimer = setTimeout(() => {
            this.isFeverTime = false;
            this.feverTimeTimer = null;
        }, 5000); // 5秒後に終了
    }

    spawnObjects() {
        if (this.gameState.isGameOver || !this.gameState.isGameStarted) return;

        const playerZ = this.player.getModel().position.z;
        const shouldSpawnCoin = Math.abs(playerZ - this.lastCoinZ) >= this.coinSpawnDistance;
        const targetZ = playerZ - 15; // 生成位置は常にプレイヤーの15マス先

        if (shouldSpawnCoin) {
            if (this.isFeverTime) {
                // フィーバータイム中は全レーンにコインを生成
                [0, 1, 2].forEach(lane => {
                    this.spawnCoin(lane, targetZ, playerZ);
                });
            } else {
                // 通常時は1レーンのみにコインを生成
                const coinLane = Math.floor(Math.random() * 3);
                this.currentCoinLane = coinLane;
                this.spawnCoin(coinLane, targetZ, playerZ);

                // コインのないレーンから障害物を生成する可能性のあるレーンを取得
                const availableLanes = [0, 1, 2].filter(lane => lane !== coinLane);
                
                // 各レーンで15%の確率で障害物を生成
                availableLanes.forEach(lane => {
                    if (Math.random() < this.obstacleChance) {
                        this.lastObstacleLane = lane;
                        this.spawnObstacle(lane, targetZ, playerZ);
                    }
                });
            }
        }
    }

    spawnCoin(lane, targetZ, playerZ) {
        const xPosition = (lane - 1) * this.laneWidth;
        const isPotion = Math.random() < this.potionChance;
        const modelPath = isPotion ? 'bottle_A_green.gltf' : 'Coin_A.gltf';
        this.loader.load(
            modelPath,
            (gltf) => {
                if (this.gameState.isGameOver || !this.gameState.isGameStarted) return;
                
                const coin = gltf.scene;
                const scale = isPotion ? 1.0 : 0.5;  // ポーションは元のサイズのまま
                coin.scale.set(scale, scale, scale);
                const newCoin = coin.clone();
                newCoin.position.set(xPosition, isPotion ? 0 : 0.5, targetZ);  // ポーションは地面に、コインは浮かせる
                newCoin.isPotion = isPotion;  // ポーションかどうかを記録
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

    spawnObstacle(lane, targetZ, playerZ) {
        const xPosition = (lane - 1) * this.laneWidth;
        const randomModel = this.obstacleModels[Math.floor(Math.random() * this.obstacleModels.length)];
        this.loader.load(
            randomModel.path,
            (gltf) => {
                if (this.gameState.isGameOver || !this.gameState.isGameStarted) return;
                
                const newObstacle = gltf.scene;
                newObstacle.scale.set(randomModel.scale, randomModel.scale, randomModel.scale);
                newObstacle.position.set(xPosition, 0, targetZ);
                this.scene.add(newObstacle);
                this.obstacles.push(newObstacle);
                this.lastObstacleZ = playerZ;
            },
            null,
            (error) => {
                console.error('GLTFLoader error:', error);
            }
        );
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
                removeObstacles.push(obstacle);
            }
        }

        // コインの更新
        for (const coin of this.coins) {
            // コインは固定位置
            coin.rotation.y += 0.05;

            if (this.checkCoinCollision(coin)) {
                this.gameState.addScore(coin.isPotion ? 50 : 10);  // ポーションの場合は50ポイント
                if (coin.isPotion) {
                    this.startFeverTime();
                }
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
        // フィーバータイムをリセット
        this.isFeverTime = false;
        if (this.feverTimeTimer) {
            clearTimeout(this.feverTimeTimer);
            this.feverTimeTimer = null;
        }
        // 位置をリセット
        this.lastCoinZ = 0;
        this.lastObstacleZ = 0;
    }
}

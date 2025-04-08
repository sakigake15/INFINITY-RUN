export class ObstacleManager {
    constructor(scene, gameState, player, laneWidth) {
        this.scene = scene;
        this.gameState = gameState;
        this.player = player;
        this.laneWidth = laneWidth;
        this.obstacles = [];
        this.coins = [];
        this.loader = new THREE.GLTFLoader();
        
        this.minSpawnInterval = 500;
        this.maxSpawnInterval = 1000;
        this.coinSpawnInterval = 300; // コインの生成間隔を0.3秒に設定
        this.coinSpawnTimer = null;
    }

    startSpawning() {
        this.spawnObstacle();
        this.startCoinSpawning();
    }

    startCoinSpawning() {
        if (this.coinSpawnTimer) return;
        this.spawnCoin();
        this.coinSpawnTimer = setInterval(() => this.spawnCoin(), this.coinSpawnInterval);
    }

    stopCoinSpawning() {
        if (this.coinSpawnTimer) {
            clearInterval(this.coinSpawnTimer);
            this.coinSpawnTimer = null;
        }
    }

    spawnObstacle() {
        if (this.gameState.isGameOver || !this.gameState.isGameStarted) return;

        this.loader.load(
            'barrel_small.gltf',
            (gltf) => {
                if (this.gameState.isGameOver || !this.gameState.isGameStarted) return;
                
                const newObstacle = gltf.scene;
                newObstacle.scale.set(1.0, 1.0, 1.0);
                
                const randomLane = Math.floor(Math.random() * 3);
                const xPosition = (randomLane - 1) * this.laneWidth;
                
                newObstacle.position.set(xPosition, 0, -15);
                this.scene.add(newObstacle);
                this.obstacles.push(newObstacle);

                // 次の障害物を生成
                setTimeout(() => this.spawnObstacle(), 
                    this.minSpawnInterval + Math.random() * (this.maxSpawnInterval - this.minSpawnInterval));
            },
            null,
            (error) => {
                console.error('GLTFLoader error:', error);
            }
        );
    }

    spawnCoin() {
        if (this.gameState.isGameOver || !this.gameState.isGameStarted) return;

        this.loader.load(
            'Coin_A.gltf',
            (gltf) => {
                if (this.gameState.isGameOver || !this.gameState.isGameStarted) return;
                
                const coin = gltf.scene;
                coin.scale.set(0.5, 0.5, 0.5);
                
                const randomLane = Math.floor(Math.random() * 3);
                const xPosition = (randomLane - 1) * this.laneWidth;
                
                const newCoin = coin.clone();
                newCoin.position.set(xPosition, 0.5, -15);
                this.scene.add(newCoin);
                this.coins.push(newCoin);
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
            obstacle.position.z += this.gameState.obstacleSpeed;
            
            if (obstacle.position.z > 2) {
                this.gameState.addScore(100);
                removeObstacles.push(obstacle);
            }
        }

        // コインの更新
        for (const coin of this.coins) {
            coin.position.z += this.gameState.obstacleSpeed;
            coin.rotation.y += 0.05;

            if (this.checkCoinCollision(coin)) {
                this.gameState.addMoney(10);
                removeCoins.push(coin);
            }
            
            if (coin.position.z > 2) {
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
        this.stopCoinSpawning();
    }
}

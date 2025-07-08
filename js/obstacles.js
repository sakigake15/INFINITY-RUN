export class ObstacleManager {
    constructor(scene, gameState, player, laneWidth, sceneManager, audioManager, particleSystem) {
        this.scene = scene;
        this.gameState = gameState;
        this.player = player;
        this.laneWidth = laneWidth;
        this.sceneManager = sceneManager;
        this.audioManager = audioManager;
        this.particleSystem = particleSystem;
        this.obstacles = [];
        this.coins = [];
        this.potionChance = 0.01; // 1%の確率でポーションに変化
        this.pumpkinChance = 0.10; // 10%の確率でかぼちゃに変化
        this.candyChance = 0.10; // 10%の確率でキャンディーに変化
        this.isFeverTime = false; // フィーバータイムの状態
        this.feverTimeTimer = null; // フィーバータイムのタイマー
        this.loader = new THREE.GLTFLoader();
        
        // 音声ファイルを読み込み
        this.coinSound = new Audio('coin1.mp3');
        this.coinSound.volume = 0.5; // 音量を調整
        this.coinSound2 = new Audio('coin2.mp3');
        this.coinSound2.volume = 0.5; // 音量を調整
        this.deathSound = new Audio('death.mp3');
        this.deathSound.volume = 0.7; // 音量を調整
        this.changeSound = new Audio('change.mp3');
        this.changeSound.volume = 0.6; // 音量を調整
        
        // 障害物のモデルパスを配列で保持
        this.obstacleModels = [
            {path: 'barrel_small.gltf', scale: 1.0},
            {path: 'detail_rocks_small.gltf.glb', scale: 2.0},
            {path: 'detail_treeC.gltf.glb', scale: 2.0}
        ];

        // 地獄世界の障害物モデルパス
        this.hellObstacleModels = [
            {path: 'candleBundle.gltf.glb', scale: 1.5},
            {path: 'gravestone.gltf.glb', scale: 1.0},
            {path: 'cauldron.gltf.glb', scale: 1.2}
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
            // フィーバータイム終了時にBGMを元に戻す
            if (this.audioManager) {
                this.audioManager.endFeverTime();
            }
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
                
                // 地獄世界では障害物生成確率を120%に増加（15% × 1.2 = 18%）
                const currentObstacleChance = this.gameState.getIsHellWorld() ? 
                    this.obstacleChance * 1.2 : this.obstacleChance;
                
                // 各レーンで障害物を生成
                availableLanes.forEach(lane => {
                    if (Math.random() < currentObstacleChance) {
                        this.lastObstacleLane = lane;
                        this.spawnObstacle(lane, targetZ, playerZ);
                    }
                });
            }
        }
    }

    spawnCoin(lane, targetZ, playerZ) {
        const xPosition = (lane - 1) * this.laneWidth;
        let modelPath = 'Coin_A.gltf';
        let scale = 0.5;
        let yPosition = 0.5;
        let itemType = 'coin';

        // 地獄世界ではキャンディー、地上世界ではかぼちゃを出現
        if (this.gameState.getIsHellWorld()) {
            const candyChance = Math.random() < this.candyChance;
            if (candyChance) {
                // 地獄世界：キャンディー
                modelPath = 'lollipopB.gltf.glb';
                scale = 1.2;
                yPosition = 0;
                itemType = 'candy';
            }
        } else {
            const pumpkinChance = Math.random() < this.pumpkinChance;
            if (pumpkinChance) {
                // 地上世界：かぼちゃ
                modelPath = 'pumpkinLarge.gltf.glb';
                scale = 1.2;
                yPosition = 0.5;
                itemType = 'pumpkin';
            }
        }

        // ポーションの処理（既存の確率で別途判定）
        const isPotion = Math.random() < this.potionChance;
        if (isPotion) {
            modelPath = 'bottle_A_green.gltf';
            scale = 1.0;
            yPosition = 0;
            itemType = 'potion';
        }

        this.loader.load(
            modelPath,
            (gltf) => {
                if (this.gameState.isGameOver || !this.gameState.isGameStarted) return;
                
                const coin = gltf.scene;
                coin.scale.set(scale, scale, scale);
                const newCoin = coin.clone();
                newCoin.position.set(xPosition, yPosition, targetZ);
                newCoin.itemType = itemType;  // アイテムタイプを記録
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
        // 地獄世界かどうかで使用する障害物配列を切り替え
        const modelArray = this.gameState.getIsHellWorld() ? 
            this.hellObstacleModels : this.obstacleModels;
        const randomModel = modelArray[Math.floor(Math.random() * modelArray.length)];
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
                // パーティクルエフェクトを生成（全てのアイテムで共通）
                if (this.particleSystem) {
                    this.particleSystem.createCoinParticles(coin.position);
                }
                
                // アイテムタイプに応じてスコアと効果を適用
                switch (coin.itemType) {
                    case 'potion':
                        this.gameState.addScore(50);
                        // フィーバータイムBGMを開始
                        if (this.audioManager) {
                            this.audioManager.startFeverTime();
                        }
                        this.startFeverTime();
                        break;
                    case 'pumpkin':
                    case 'candy':
                        this.gameState.addScore(10);
                        // 世界切り替え音を再生
                        this.changeSound.currentTime = 0;
                        this.changeSound.play().catch(error => {
                            console.log('世界切り替え音声再生エラー:', error);
                        });
                        this.gameState.toggleWorld();
                        this.sceneManager.toggleWorld();
                        // 世界切り替え時に既存の障害物のテクスチャを更新
                        this.updateObstacleTextures();
                        // BGMを切り替え
                        if (this.audioManager) {
                            this.audioManager.switchBGM(this.gameState.getIsHellWorld());
                        }
                        break;
                    case 'coin':
                    default:
                        // 地獄世界では50点、地上世界では10点
                        const coinScore = this.gameState.getIsHellWorld() ? 50 : 10;
                        this.gameState.addScore(coinScore);
                        
                        // 世界に応じてコイン取得音を再生
                        if (this.gameState.getIsHellWorld()) {
                            // 地獄世界ではcoin2.mp3を再生
                            this.coinSound2.currentTime = 0;
                            this.coinSound2.play().catch(error => {
                                console.log('地獄コイン音声再生エラー:', error);
                            });
                        } else {
                            // 地上世界ではcoin1.mp3を再生
                            this.coinSound.currentTime = 0;
                            this.coinSound.play().catch(error => {
                                console.log('地上コイン音声再生エラー:', error);
                            });
                        }
                        break;
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
            // 死亡音を再生
            this.deathSound.currentTime = 0;
            this.deathSound.play().catch(error => {
                console.log('死亡音声再生エラー:', error);
            });
            
            this.gameState.handleGameOver(
                this.player.getModel(),
                this.player.getRunningAction(),
                this.audioManager
            );
        }
    }

    // 世界切り替え時に既存の障害物のテクスチャを変更
    updateObstacleTextures() {
        // 現在の世界に応じたモデル配列を取得
        const modelArray = this.gameState.getIsHellWorld() ? 
            this.hellObstacleModels : this.obstacleModels;
        
        // 既存の障害物をそれぞれ新しいモデルに置き換え
        const obstaclesToReplace = [...this.obstacles]; // 配列をコピー
        
        obstaclesToReplace.forEach((obstacle, index) => {
            const position = obstacle.position.clone();
            const randomModel = modelArray[Math.floor(Math.random() * modelArray.length)];
            
            // 古い障害物を削除
            this.scene.remove(obstacle);
            const obstacleIndex = this.obstacles.indexOf(obstacle);
            if (obstacleIndex > -1) {
                this.obstacles.splice(obstacleIndex, 1);
            }
            
            // 新しい障害物を同じ位置に生成
            this.loader.load(
                randomModel.path,
                (gltf) => {
                    if (this.gameState.isGameOver || !this.gameState.isGameStarted) return;
                    
                    const newObstacle = gltf.scene;
                    newObstacle.scale.set(randomModel.scale, randomModel.scale, randomModel.scale);
                    newObstacle.position.copy(position);
                    this.scene.add(newObstacle);
                    this.obstacles.push(newObstacle);
                },
                null,
                (error) => {
                    console.error('GLTFLoader error during texture update:', error);
                }
            );
        });
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

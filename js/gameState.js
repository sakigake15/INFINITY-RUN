export class GameState {
    constructor() {
        this.isGameOver = false;
        this.isGameStarted = false;
        this.score = 0;
        this.money = 0;
        this.highScore = localStorage.getItem('highScore') || 0;
        this.obstacleSpeed = 0.2;
        this.isHellWorld = false; // 地獄世界のフラグ
        
        // 初期表示
        this.updateHighScoreDisplay();
    }

    startGame() {
        this.isGameStarted = true;
        this.isGameOver = false;
        document.getElementById('titleScreen').classList.add('hidden');
        document.getElementById('scoreDisplay').classList.remove('hidden');
        document.getElementById('scoreDisplay').style.animation = 'fadeIn 0.5s ease forwards';
    }

    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }
        this.updateHighScoreDisplay();
    }

    updateHighScoreDisplay() {
        document.getElementById('highScore').textContent = this.highScore;
    }

    initScore() {
        this.score = 0;
        document.getElementById('currentScore').textContent = '0';
        document.getElementById('finalScore').textContent = '0';
        document.getElementById('scoreDisplay').classList.add('hidden');
    }

    resetGame() {
        this.isGameOver = false;
        this.isGameStarted = false;
        this.obstacleSpeed = 0.2;
        this.money = 0;
        this.initScore();

        // ゲームオーバー画面を非表示
        document.getElementById('gameOverScreen').classList.add('hidden');

        // 地獄世界の場合は地上世界に戻す
        if (this.isHellWorld) {
            this.isHellWorld = false;
            return true; // 世界が切り替わったことを通知
        }
        
        return false; // 世界は切り替わっていない
    }

    handleGameOver(player, runningAction, audioManager = null) {
        this.isGameOver = true;
        this.obstacleSpeed = 0;

        // BGMを停止
        if (audioManager) {
            audioManager.stopCurrentBGM();
        }

        // プレイヤーモデルの全マテリアルを赤く変更
        player.traverse((child) => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.originalColor = mat.color.clone();
                        mat.emissive = new THREE.Color(0xff0000);
                    });
                } else {
                    child.material.originalColor = child.material.color.clone();
                    child.material.emissive = new THREE.Color(0xff0000);
                }
            }
        });

        // アニメーションを停止
        if (runningAction) {
            runningAction.stop();
        }

        // スコアを更新してゲームオーバー画面を表示
        this.updateHighScore();
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    // スコアとマネーの更新
    addScore(points) {
        this.score += points;
        document.getElementById('currentScore').textContent = this.score;
    }

    addMoney(amount) {
        this.money += amount;
        const moneyElement = document.getElementById('currentMoney');
        if (moneyElement) {
            moneyElement.textContent = this.money;
        }
    }

    // 世界切り替え
    toggleWorld() {
        this.isHellWorld = !this.isHellWorld;
    }

    // 地獄世界かどうかを取得
    getIsHellWorld() {
        return this.isHellWorld;
    }
}

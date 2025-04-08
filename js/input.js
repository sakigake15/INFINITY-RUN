export class InputHandler {
    constructor(gameState, laneWidth) {
        this.gameState = gameState;
        this.laneWidth = laneWidth;
        this.currentLane = 1; // 0: 左, 1: 中央, 2: 右
        this.targetX = 0; // 目標のX座標
        this.touchStartX = 0; // タッチ開始位置
        this.moveSpeed = 0.2; // 移動速度
        this.player = null;
        
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        this.setupInputHandlers();
    }

    setPlayer(player) {
        this.player = player;
    }

    setupInputHandlers() {
        if (!this.isMobile) {
            this.setupKeyboardHandlers();
        } else {
            this.setupTouchHandlers();
        }
    }

    setupKeyboardHandlers() {
        window.addEventListener('keydown', (event) => {
            if (!this.player || !this.gameState.isGameStarted || this.gameState.isGameOver) return;

            switch(event.key) {
                case 'ArrowLeft':
                    if (this.currentLane > 0) {
                        this.currentLane--;
                        this.targetX = (this.currentLane - 1) * this.laneWidth;
                    }
                    break;
                case 'ArrowRight':
                    if (this.currentLane < 2) {
                        this.currentLane++;
                        this.targetX = (this.currentLane - 1) * this.laneWidth;
                    }
                    break;
            }
        });
    }

    setupTouchHandlers() {
        window.addEventListener('touchstart', (event) => {
            this.touchStartX = event.touches[0].clientX;
        });

        window.addEventListener('touchend', (event) => {
            if (!this.player || !this.gameState.isGameStarted || this.gameState.isGameOver) return;

            const touchEndX = event.changedTouches[0].clientX;
            const swipeDistance = touchEndX - this.touchStartX;

            if (Math.abs(swipeDistance) > 50) { // 50px以上のスワイプで方向転換
                if (swipeDistance < 0 && this.currentLane > 0) { // 左スワイプ
                    this.currentLane--;
                    this.targetX = (this.currentLane - 1) * this.laneWidth;
                } else if (swipeDistance > 0 && this.currentLane < 2) { // 右スワイプ
                    this.currentLane++;
                    this.targetX = (this.currentLane - 1) * this.laneWidth;
                }
            }
        });
    }

    updatePlayerPosition() {
        if (this.player) {
            const playerModel = this.player.getModel();
            if (playerModel) {
                const diff = this.targetX - playerModel.position.x;
                if (Math.abs(diff) > 0.01) {
                    playerModel.position.x += diff * this.moveSpeed;
                }
            }
        }
    }
}

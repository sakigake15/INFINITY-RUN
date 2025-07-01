import { SceneManager } from './scene.js';
import { Player } from './player.js';
import { ObstacleManager } from './obstacles.js';
import { GameState } from './gameState.js';
import { InputHandler } from './input.js';

class Game {
    constructor() {
        this.gameState = new GameState();
        this.sceneManager = new SceneManager(this.gameState);
        this.player = new Player(this.sceneManager.getScene(), 'Rogue.glb');
        this.obstacleManager = new ObstacleManager(
            this.sceneManager.getScene(),
            this.gameState,
            this.player,
            this.sceneManager.getLaneWidth(),
            this.sceneManager
        );
        this.inputHandler = new InputHandler(
            this.gameState,
            this.sceneManager.getLaneWidth(),
            this.sceneManager
        );

        // プレイヤーが読み込まれたらInputHandlerに設定
        this.player.onLoad = () => {
            this.inputHandler.setPlayer(this.player);
        };

        this.setupEventListeners();
        this.animate();
    }

    setupEventListeners() {
        document.getElementById('retryButton').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
    }

    startGame() {
        this.gameState.startGame();
        this.obstacleManager.startSpawning();
        this.player.startRunning();
    }

    resetGame() {
        const worldChanged = this.gameState.resetGame();
        if (worldChanged) {
            this.sceneManager.switchToEarthWorld(); // 地上世界に強制的に切り替え
        }
        this.player.resetPosition();
        this.obstacleManager.reset();
        this.sceneManager.reset(); // シーン全体をリセット（カメラ、レーン、地面）
        
        // ゲームを再開
        this.startGame();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.gameState.isGameStarted && !this.gameState.isGameOver) {
            this.inputHandler.updatePlayerPosition();
            this.obstacleManager.update();
            this.player.update();
        }
        this.sceneManager.render();
    }
}

// ゲームの初期化
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});

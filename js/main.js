import { SceneManager } from './scene.js';
import { Player } from './player.js';
import { ObstacleManager } from './obstacles.js';
import { GameState } from './gameState.js';
import { InputHandler } from './input.js';

class Game {
    constructor() {
        this.sceneManager = new SceneManager();
        this.gameState = new GameState();
        this.player = new Player(this.sceneManager.getScene(), 'Rogue.glb');
        this.obstacleManager = new ObstacleManager(
            this.sceneManager.getScene(),
            this.gameState,
            this.player,
            this.sceneManager.getLaneWidth()
        );
        this.inputHandler = new InputHandler(
            this.gameState,
            this.sceneManager.getLaneWidth()
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

        document.getElementById('titleButton').addEventListener('click', () => {
            this.gameState.backToTitle();
        });
    }

    startGame() {
        this.gameState.startGame();
        this.obstacleManager.spawnObstacle();
        this.player.startRunning();
    }

    resetGame() {
        this.gameState.resetGame();
        this.player.resetPosition();
        this.obstacleManager.reset();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (!this.gameState.isGameOver && this.gameState.isGameStarted) {
            this.inputHandler.updatePlayerPosition();
            this.obstacleManager.update();
        }

        this.player.update();
        this.sceneManager.render();
    }
}

// ゲームの初期化
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});

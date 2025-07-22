import { SceneManager } from './scene.js';
import { Player } from './player.js';
import { ObstacleManager } from './obstacles.js';
import { GameState } from './gameState.js';
import { InputHandler } from './input.js';
import { AudioManager } from './audioManager.js';
import { SoundEffectManager } from './soundEffectManager.js';
import { ParticleSystem } from './particleSystem.js';

class Game {
    constructor() {
        this.gameState = new GameState();
        this.audioManager = new AudioManager();
        this.soundEffectManager = new SoundEffectManager();
        this.sceneManager = new SceneManager(this.gameState);
        this.particleSystem = new ParticleSystem(this.sceneManager.getScene());
        this.player = new Player(this.sceneManager.getScene(), 'Rogue.glb');
        this.obstacleManager = new ObstacleManager(
            this.sceneManager.getScene(),
            this.gameState,
            this.player,
            this.sceneManager.getLaneWidth(),
            this.sceneManager,
            this.audioManager,
            this.soundEffectManager,
            this.particleSystem
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

        document.getElementById('startButton').addEventListener('click', async () => {
            // ユーザーインタラクション時に音声を初期化
            await this.audioManager.initializeAudio();
            await this.soundEffectManager.initializeSounds();
            this.startGame();
        });
    }

    async startGame() {
        this.gameState.startGame();
        this.obstacleManager.startSpawning();
        this.player.startRunning();
        // BGMを開始（初期は地上世界）
        await this.audioManager.startBGM(this.gameState.getIsHellWorld());
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
            this.particleSystem.update();
        } else {
            // ゲームが停止中でもパーティクルは更新し続ける
            this.particleSystem.update();
        }
        this.sceneManager.render();
    }
}

// ゲームの初期化
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});

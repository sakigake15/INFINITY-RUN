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
        document.getElementById('retryButton').addEventListener('click', async () => {
            // リトライ時も音声初期化を確実にする
            await this.ensureAudioInitialization();
            this.resetGame();
        });

        document.getElementById('startButton').addEventListener('click', async () => {
            // ユーザーインタラクション時に音声を初期化
            await this.ensureAudioInitialization();
            this.startGame();
        });

        // ページ読み込み完了後の追加初期化
        document.addEventListener('DOMContentLoaded', async () => {
            // 最初のユーザーインタラクションを待つ
            const waitForInteraction = () => {
                return new Promise((resolve) => {
                    const handleInteraction = async () => {
                        document.removeEventListener('click', handleInteraction);
                        document.removeEventListener('touchstart', handleInteraction);
                        document.removeEventListener('keydown', handleInteraction);
                        await this.ensureAudioInitialization();
                        resolve();
                    };
                    
                    document.addEventListener('click', handleInteraction, { once: true });
                    document.addEventListener('touchstart', handleInteraction, { once: true });
                    document.addEventListener('keydown', handleInteraction, { once: true });
                });
            };
            
            // 最初のインタラクションを待機
            await waitForInteraction();
        });
    }

    // 音声初期化を確実に行う
    async ensureAudioInitialization() {
        try {
            console.log('音声初期化処理開始');
            
            // 並列で初期化を実行
            await Promise.all([
                this.audioManager.initializeAudio(),
                this.soundEffectManager.initializeSounds()
            ]);
            
            console.log('音声初期化処理完了');
        } catch (error) {
            console.log('音声初期化処理エラー:', error);
            
            // エラーが発生した場合は個別に初期化を試行
            try {
                await this.audioManager.initializeAudio();
            } catch (e) {
                console.log('BGM初期化エラー:', e);
            }
            
            try {
                await this.soundEffectManager.initializeSounds();
            } catch (e) {
                console.log('SE音初期化エラー:', e);
            }
        }
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

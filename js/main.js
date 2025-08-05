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

        // 音声初期化フラグ（Version 1.1.5対応）
        this.isAudioInitialized = false;

        // プレイヤーが読み込まれたらInputHandlerに設定
        this.player.onLoad = () => {
            this.inputHandler.setPlayer(this.player);
        };

        // バックグラウンド再生防止の設定
        this.setupBackgroundPlayPrevention();
        
        this.setupEventListeners();
        this.animate();
    }

    setupEventListeners() {
        document.getElementById('retryButton').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('startButton').addEventListener('click', async () => {
            // ユーザーインタラクション時に音声を初期化（Version 1.1.5対応）
            try {
                await this.audioManager.initializeAudio();
                await this.soundEffectManager.initializeSounds();
                this.isAudioInitialized = true; // 初期化完了フラグを設定
                console.log('メインゲーム音声初期化完了');
                this.startGame();
            } catch (error) {
                console.error('メインゲーム音声初期化エラー:', error);
                // 音声初期化に失敗してもゲームは開始する
                this.startGame();
            }
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

    // バックグラウンド再生防止の設定（Version 1.1.5 - メインゲーム対応）
    setupBackgroundPlayPrevention() {
        // Page Visibility API を使用してタブの可視性を監視
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('メインゲーム: タブが非表示になりました - 音声を停止');
                this.pauseOnBackground();
            } else {
                console.log('メインゲーム: タブが表示されました');
                this.resumeFromBackground();
            }
        });

        // window.onblur/onfocus でもバックアップ
        window.addEventListener('blur', () => {
            console.log('メインゲーム: ウィンドウがフォーカスを失いました - 音声を停止');
            this.pauseOnBackground();
        });

        window.addEventListener('focus', () => {
            console.log('メインゲーム: ウィンドウがフォーカスを取得しました');
            this.resumeFromBackground();
        });

        // モバイルでのページ離脱時
        window.addEventListener('pagehide', () => {
            console.log('メインゲーム: ページが隠されました - 音声を停止');
            this.pauseOnBackground();
        });

        window.addEventListener('pageshow', () => {
            console.log('メインゲーム: ページが表示されました');
            this.resumeFromBackground();
        });
    }

    // バックグラウンド時の音声停止（Version 1.1.5）
    pauseOnBackground() {
        // 音声初期化完了前は何もしない（重要：ゲーム開始前の誤動作防止）
        if (!this.audioManager || !this.isAudioInitialized) {
            console.log('メインゲーム: バックグラウンド処理スキップ - 音声未初期化');
            return;
        }
        
        try {
            this.audioManager.pauseBGM();
            console.log('メインゲーム: バックグラウンド再生防止 - BGM一時停止');
        } catch (error) {
            console.error('メインゲーム: バックグラウンド音声停止エラー:', error);
        }
    }

    // フォアグラウンド復帰時の処理（Version 1.1.5）
    resumeFromBackground() {
        // 音声初期化完了前は何もしない（重要：ゲーム開始前の誤動作防止）
        if (!this.audioManager || !this.isAudioInitialized) {
            console.log('メインゲーム: フォアグラウンド復帰処理スキップ - 音声未初期化');
            return;
        }
        
        // ゲーム中の場合のみBGMを再開
        if (this.gameState.isGameStarted && !this.gameState.isGameOver) {
            try {
                this.audioManager.resumeBGM();
                console.log('メインゲーム: フォアグラウンド復帰 - BGM再開');
            } catch (error) {
                console.error('メインゲーム: フォアグラウンド音声再開エラー:', error);
            }
        } else {
            console.log('メインゲーム: ゲーム停止中のため音声再開なし');
        }
    }
}

// ゲームの初期化
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});

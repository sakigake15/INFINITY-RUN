import { SceneManager } from './scene.js';
import { Player } from './player.js';
import { ObstacleManager } from './obstacles.js';
import { GameState } from './gameState.js';
import { InputHandler } from './input.js';
import { HowlerSoundManager } from './howlerSoundManager.js';
import { SoundEffectManager } from './soundEffectManager.js';
import { ParticleSystem } from './particleSystem.js';
import { RankingManager } from './rankingManager.js';
import { RankingDisplay } from './rankingDisplay.js';

class Game {
    constructor() {
        this.gameState = new GameState();
        this.audioManager = new HowlerSoundManager();
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
        
        // ObstacleManagerにGameインスタンスの参照を設定
        this.obstacleManager.setGameInstance(this);
        this.inputHandler = new InputHandler(
            this.gameState,
            this.sceneManager.getLaneWidth(),
            this.sceneManager
        );

        // ランキングシステムの初期化
        this.rankingApiUrl = 'https://script.google.com/macros/s/AKfycbzD_bxklwWbJpuAn_HZfPP7XKXfLIHkpTYKfqzPVw1jI1-eRkGLmy_NTmzpwuDzXmOT/exec';
        this.rankingManager = new RankingManager(this.rankingApiUrl);
        this.rankingDisplay = new RankingDisplay();

        // 音声初期化フラグ（Version 1.1.5対応）
        this.isAudioInitialized = false;

        // プレイヤーが読み込まれたらInputHandlerに設定
        this.player.onLoad = () => {
            this.inputHandler.setPlayer(this.player);
        };

        // バックグラウンド再生防止の設定
        this.setupBackgroundPlayPrevention();
        
        this.setupEventListeners();
        this.initializeRanking();
        this.animate();
    }

    setupEventListeners() {
        document.getElementById('retryButton').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('startButton').addEventListener('click', async () => {
            // ユーザーインタラクション時に音声を初期化（HowlerJS Version 2.0.0対応）
            try {
                // HowlerSoundManagerの音声ファイル事前読み込み
                await this.audioManager.preloadSounds();
                // HowlerSoundManagerの音声初期化
                await this.audioManager.initializeAudio();
                await this.soundEffectManager.initializeSounds();
                this.isAudioInitialized = true; // 初期化完了フラグを設定
                console.log('メインゲーム HowlerJS音声初期化完了');
                this.startGame();
            } catch (error) {
                console.error('メインゲーム HowlerJS音声初期化エラー:', error);
                // 音声初期化に失敗してもゲームは開始する
                this.startGame();
            }
        });

        // ランキング再読み込みボタンのイベントリスナー
        this.rankingDisplay.setRefreshCallback(() => {
            this.refreshRanking();
        });
    }

    /**
     * ランキングシステムを初期化
     */
    async initializeRanking() {
        console.log('ランキングシステム初期化開始');
        
        // ローディング状態を表示
        this.rankingDisplay.showLoading();
        
        try {
            // バックグラウンドでランキングデータを取得
            const rankingData = await this.rankingManager.fetchRanking();
            
            if (rankingData) {
                // ランキングデータを表示
                this.rankingDisplay.displayRanking(rankingData);
                console.log('ランキング初期化完了');
                
                // ユーザーのハイスコアがランキング内にある場合はハイライト
                const userHighScore = this.gameState.highScore;
                if (userHighScore > 0) {
                    this.rankingDisplay.showUserRank(userHighScore, rankingData);
                }
            } else {
                // エラー状態を表示
                this.rankingDisplay.showError('ランキングデータの取得に失敗しました');
                console.error('ランキング初期化失敗');
            }
        } catch (error) {
            console.error('ランキング初期化エラー:', error);
            this.rankingDisplay.showError('ランキングシステムの初期化に失敗しました');
        }
    }

    /**
     * ランキングデータを手動で更新
     */
    async refreshRanking() {
        console.log('ランキング手動更新開始');
        
        // ローディング状態を表示
        this.rankingDisplay.showLoading();
        
        try {
            // 強制的にデータを再取得
            const rankingData = await this.rankingManager.fetchRanking(true);
            
            if (rankingData) {
                this.rankingDisplay.displayRanking(rankingData);
                console.log('ランキング手動更新完了');
                
                // ユーザーのハイスコアがランキング内にある場合はハイライト
                const userHighScore = this.gameState.highScore;
                if (userHighScore > 0) {
                    this.rankingDisplay.showUserRank(userHighScore, rankingData);
                }
            } else {
                this.rankingDisplay.showError('ランキングデータの更新に失敗しました');
            }
        } catch (error) {
            console.error('ランキング手動更新エラー:', error);
            this.rankingDisplay.showError('ランキングの更新中にエラーが発生しました');
        }
    }

    /**
     * ゲーム終了時のランキング関連処理
     */
    async handleGameEndRanking() {
        const finalScore = this.gameState.score;
        
        // キャッシュされたランキングデータを取得
        const rankingData = this.rankingManager.getCachedRanking();
        
        if (rankingData && finalScore > 0) {
            // ユーザーの順位を計算・表示
            const userRank = this.rankingManager.getUserRank(finalScore);
            
            if (userRank && userRank <= 5) {
                console.log(`ランキング入り可能: ${userRank}位 (スコア: ${finalScore})`);
                // 将来的にはここでスコア送信ダイアログを表示
                // 現在は表示のみ
            } else {
                console.log(`ランキング外: ${userRank ? userRank + '位' : '圏外'} (スコア: ${finalScore})`);
            }
        }
    }

    async startGame() {
        this.gameState.startGame();
        this.obstacleManager.startSpawning();
        this.player.startRunning();
        // BGMを開始（初期は地上世界）
        try {
            if (this.gameState.getIsHellWorld()) {
                await this.audioManager.playBGM('jigoku');
            } else {
                await this.audioManager.playBGM('chijou');
            }
        } catch (error) {
            console.error('HowlerJS BGM再生エラー:', error);
        }
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

    // バックグラウンド時の音声停止（HowlerJS Version 2.0.0）
    pauseOnBackground() {
        // 音声初期化完了前は何もしない（重要：ゲーム開始前の誤動作防止）
        if (!this.audioManager || !this.isAudioInitialized) {
            console.log('メインゲーム: バックグラウンド処理スキップ - 音声未初期化');
            return;
        }
        
        try {
            this.audioManager.pauseCurrentBGM();
            console.log('メインゲーム: HowlerJS バックグラウンド再生防止 - BGM一時停止');
        } catch (error) {
            console.error('メインゲーム: HowlerJS バックグラウンド音声停止エラー:', error);
        }
    }

    // フォアグラウンド復帰時の処理（HowlerJS Version 2.0.0）
    resumeFromBackground() {
        // 音声初期化完了前は何もしない（重要：ゲーム開始前の誤動作防止）
        if (!this.audioManager || !this.isAudioInitialized) {
            console.log('メインゲーム: フォアグラウンド復帰処理スキップ - 音声未初期化');
            return;
        }
        
        // ゲーム中の場合のみBGMを再開
        if (this.gameState.isGameStarted && !this.gameState.isGameOver) {
            try {
                this.audioManager.resumeCurrentBGM();
                console.log('メインゲーム: HowlerJS フォアグラウンド復帰 - BGM再開');
            } catch (error) {
                console.error('メインゲーム: HowlerJS フォアグラウンド音声再開エラー:', error);
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

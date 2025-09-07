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
import { NameInputDialog } from './nameInputDialog.js';

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
        this.rankingApiUrl = 'https://script.google.com/macros/s/AKfycbwLTnt3-Wfb5bWy5K11tcwTdM1B7OfS8eu8DUByXCwUO3O24ukgLAKDPGV2MF62544-/exec';
        this.rankingManager = new RankingManager(this.rankingApiUrl);
        this.rankingDisplay = new RankingDisplay();
        this.nameInputDialog = new NameInputDialog();

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

        // ランキング再読み込みボタンは削除されたため、イベントリスナー設定なし
    }

    /**
     * ランキングデータを手動で更新（ゲームオーバー画面用）
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
                
                // 現在のスコアでユーザーの順位を表示
                const currentScore = this.gameState.score;
                if (currentScore > 0) {
                    this.rankingDisplay.showUserRank(currentScore, rankingData);
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
        
        console.log('ゲーム終了 - ランキング表示開始');
        
        // ゲームオーバー画面でランキングを表示
        this.rankingDisplay.showLoading();
        
        try {
            // 最新のランキングデータを取得
            console.log('最新ランキングデータを取得中...');
            const rankingData = await this.rankingManager.fetchRanking();
            
            if (rankingData) {
                // ランキングデータを表示
                this.rankingDisplay.displayRanking(rankingData);
                console.log('ゲームオーバー画面にランキング表示完了');
                
                // ユーザーの順位を計算・表示
                if (finalScore > 0) {
                    const userRank = this.rankingManager.getUserRank(finalScore, rankingData);
                    this.rankingDisplay.showUserRank(finalScore, rankingData);
                    
                    // 5位以内チェック
                    const shouldPost = this.rankingManager.shouldPostToRanking(finalScore, rankingData);
                    
                    if (shouldPost.shouldPost) {
                        console.log(`ランキング入り可能: ${userRank}位 (スコア: ${finalScore})`);
                        console.log(`投稿理由: ${shouldPost.reason}`);
                        
                        // 名前入力ダイアログを表示
                        await this.showNameInputDialog(finalScore);
                    } else {
                        console.log(`ランキング外: ${userRank ? userRank + '位' : '圏外'} (スコア: ${finalScore})`);
                        console.log(`投稿不可理由: ${shouldPost.reason}`);
                    }
                }
            } else {
                // エラー状態を表示
                this.rankingDisplay.showError('ランキングデータの取得に失敗しました');
                console.error('ゲーム終了時ランキング取得失敗');
            }
        } catch (error) {
            console.error('ゲーム終了時ランキング処理エラー:', error);
            this.rankingDisplay.showError('ランキングの表示中にエラーが発生しました');
        }
    }

    /**
     * 名前入力ダイアログを表示してスコアを投稿
     * @param {number} score - 投稿するスコア
     */
    async showNameInputDialog(score) {
        return new Promise((resolve) => {
            this.nameInputDialog.show(
                // 投稿ボタンが押された時の処理
                async (playerName) => {
                    console.log(`スコア投稿開始: ${playerName} - ${score}点`);
                    
                    try {
                        // 投稿中のフィードバック表示
                        this.showPostingFeedback('投稿中...', 'info');
                        
                        // スコアを投稿
                        const result = await this.rankingManager.postScore(score, playerName);
                        
                        if (result.success) {
                            console.log('スコア投稿成功:', result);
                            this.showPostingFeedback(
                                `投稿完了！ ${result.rank}位にランクインしました！`, 
                                'success'
                            );
                            
                            // ランキングを更新表示
                            await this.sleep(1500); // 待機
                            await this.refreshRanking();
                        } else {
                            console.error('スコア投稿失敗:', result.message);
                            this.showPostingFeedback(
                                `投稿失敗: ${result.message}`, 
                                'error'
                            );
                        }
                    } catch (error) {
                        console.error('スコア投稿エラー:', error);
                        this.showPostingFeedback(
                            '投稿中にエラーが発生しました', 
                            'error'
                        );
                    }
                    
                    // ダイアログを閉じる
                    this.nameInputDialog.hide();
                    resolve();
                },
                // キャンセルボタンが押された時の処理
                () => {
                    console.log('スコア投稿をキャンセルしました');
                    resolve();
                }
            );
        });
    }

    /**
     * 投稿状況のフィードバックを表示
     * @param {string} message - 表示メッセージ
     * @param {string} type - メッセージタイプ ('info', 'success', 'error')
     */
    showPostingFeedback(message, type) {
        // 既存のフィードバック要素があれば削除
        const existingFeedback = document.getElementById('posting-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // フィードバック要素を作成
        const feedback = document.createElement('div');
        feedback.id = 'posting-feedback';
        feedback.className = `posting-feedback ${type}`;
        feedback.textContent = message;

        // スタイルを適用
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10001;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            opacity: 0;
        `;

        // タイプ別のスタイル
        switch (type) {
            case 'info':
                feedback.style.background = '#2196F3';
                feedback.style.color = '#ffffff';
                break;
            case 'success':
                feedback.style.background = '#4CAF50';
                feedback.style.color = '#ffffff';
                break;
            case 'error':
                feedback.style.background = '#f44336';
                feedback.style.color = '#ffffff';
                break;
        }

        // DOMに追加
        document.body.appendChild(feedback);

        // アニメーション表示
        setTimeout(() => {
            feedback.style.opacity = '1';
        }, 10);

        // 自動で消去（エラー以外の場合）
        if (type !== 'error') {
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.style.opacity = '0';
                    setTimeout(() => {
                        if (feedback.parentNode) {
                            feedback.remove();
                        }
                    }, 300);
                }
            }, 3000);
        } else {
            // エラーメッセージは長めに表示
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.style.opacity = '0';
                    setTimeout(() => {
                        if (feedback.parentNode) {
                            feedback.remove();
                        }
                    }, 300);
                }
            }, 5000);
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

    /**
     * 指定時間待機
     * @param {number} ms - 待機時間（ミリ秒）
     * @return {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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

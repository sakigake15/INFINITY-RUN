import { AudioManager } from './audioManager.js';

class SoundTestDemo {
    constructor() {
        this.audioManager = null;
        this.isInitialized = false;
        this.loadingStatus = document.getElementById('loadingStatus');
        this.audioStatus = document.getElementById('audioStatus');
        this.startButton = document.getElementById('startButton');
        this.playbackStatus = document.getElementById('playbackStatus');
        this.bgmControls = document.getElementById('bgmControls');
        this.deviceInfo = document.getElementById('deviceInfo');
        
        // ボタンの参照を取得
        this.playChijouBtn = document.getElementById('playChijouBtn');
        this.playJigokuBtn = document.getElementById('playJigokuBtn');
        this.playFeverBtn = document.getElementById('playFeverBtn');
        this.stopBtn = document.getElementById('stopBtn');
        
        // バックグラウンド再生防止の設定
        this.setupBackgroundPlayPrevention();
        
        this.init();
    }

    async init() {
        console.log('音声テストデモ初期化開始');
        
        // 端末情報を表示
        this.displayDeviceInfo();
        
        try {
            // AudioManagerを初期化
            this.audioManager = new AudioManager();
            
            // 音声ファイルの読み込み待機をシミュレート
            await this.waitForAudioLoad();
            
            // 読み込み完了後の処理
            this.onAudioLoaded();
            
        } catch (error) {
            console.error('音声初期化エラー:', error);
            this.showError('音声の初期化に失敗しました: ' + error.message);
        }
    }

    // 音声ファイル読み込み待機（実際には即座に完了するが、UIのデモのため少し待機）
    async waitForAudioLoad() {
        return new Promise((resolve) => {
            // 実際の読み込み処理をシミュレート
            setTimeout(() => {
                console.log('音声ファイル読み込み完了');
                resolve();
            }, 2000); // 2秒待機してローディング表示をデモ
        });
    }

    // 音声読み込み完了時の処理
    onAudioLoaded() {
        // ローディング表示を隠す
        this.loadingStatus.style.display = 'none';
        
        // 準備完了表示を表示
        this.audioStatus.style.display = 'block';
        this.audioStatus.innerHTML = '<span class="success">✓ 音声の準備が完了しました！STARTボタンを押してください</span>';
        
        // STARTボタンを有効化
        this.startButton.disabled = false;
        
        // STARTボタンのイベントリスナーを設定
        this.startButton.addEventListener('click', () => this.onStartClick());
    }

    // STARTボタンクリック時の処理 (Version 1.1.1 - ボタン状態修正)
    async onStartClick() {
        console.log('STARTボタンがクリックされました - Version 1.1.1');
        
        try {
            // ボタンを無効化
            this.startButton.disabled = true;
            this.startButton.textContent = '初期化中...';
            
            // AudioManagerの音声初期化を実行（ユーザーインタラクション後）
            console.log('音声初期化開始...');
            await this.audioManager.initializeAudio();
            
            console.log('音声初期化完了');
            
            // ボタンテキストを更新（重要：この処理が不足していた）
            this.startButton.textContent = '初期化完了✓';
            
            // UIを更新
            this.audioStatus.innerHTML = '<span class="success">✓ 音声コンテキストが有効化されました！</span>';
            
            // BGM再生開始
            console.log('BGM再生準備...');
            await this.startBGM();
            
            // BGMコントロールを表示
            this.showBGMControls();
            
            // ボタンを非表示にして、初期化完了を明確に示す
            this.startButton.style.display = 'none';
            
            this.isInitialized = true;
            console.log('全ての初期化処理完了');
            
        } catch (error) {
            console.error('音声初期化エラー:', error);
            this.showError('音声の初期化に失敗しました: ' + error.message);
            
            // ボタンを再度有効化
            this.startButton.disabled = false;
            this.startButton.textContent = 'START';
        }
    }

    // BGM再生開始
    async startBGM() {
        try {
            console.log('地上BGM再生開始');
            // 明示的に現在のBGMを停止してから新しいBGMを再生
            this.audioManager.stopCurrentBGM();
            await new Promise(resolve => setTimeout(resolve, 100)); // 短い待機
            await this.audioManager.playChijouBGM();
            
            // 再生状況を表示
            this.playbackStatus.style.display = 'block';
            this.playbackStatus.innerHTML = '<span class="success">🎵 地上BGM再生中...</span>';
            
        } catch (error) {
            console.error('BGM再生エラー:', error);
            this.showError('BGMの再生に失敗しました: ' + error.message);
        }
    }

    // BGMコントロールを表示
    showBGMControls() {
        this.bgmControls.style.display = 'block';
        
        // 各ボタンのイベントリスナーを設定（重複防止のため一度だけ設定）
        if (!this.bgmControlsInitialized) {
            this.playChijouBtn.addEventListener('click', () => this.playChijouBGM());
            this.playJigokuBtn.addEventListener('click', () => this.playJigokuBGM());
            this.playFeverBtn.addEventListener('click', () => this.playFeverBGM());
            this.stopBtn.addEventListener('click', () => this.stopBGM());
            this.bgmControlsInitialized = true;
        }
    }

    // 地上BGM再生
    async playChijouBGM() {
        if (!this.isInitialized) return;
        
        // ボタンを一時的に無効化して重複クリックを防止
        this.disableAllBGMButtons();
        
        try {
            console.log('地上BGM切り替え開始');
            // 確実に現在のBGMを停止
            this.audioManager.stopCurrentBGM();
            await new Promise(resolve => setTimeout(resolve, 200)); // 停止完了待機
            
            await this.audioManager.playChijouBGM();
            this.playbackStatus.innerHTML = '<span class="success">🌍 地上BGM再生中...</span>';
            console.log('地上BGM再生完了');
        } catch (error) {
            console.error('地上BGM再生エラー:', error);
            this.showError('地上BGMの再生に失敗しました');
        } finally {
            this.enableAllBGMButtons();
        }
    }

    // 地獄BGM再生
    async playJigokuBGM() {
        if (!this.isInitialized) return;
        
        // ボタンを一時的に無効化して重複クリックを防止
        this.disableAllBGMButtons();
        
        try {
            console.log('地獄BGM切り替え開始');
            // 確実に現在のBGMを停止
            this.audioManager.stopCurrentBGM();
            await new Promise(resolve => setTimeout(resolve, 200)); // 停止完了待機
            
            await this.audioManager.playJigokuBGM();
            this.playbackStatus.innerHTML = '<span class="success">🔥 地獄BGM再生中...</span>';
            console.log('地獄BGM再生完了');
        } catch (error) {
            console.error('地獄BGM再生エラー:', error);
            this.showError('地獄BGMの再生に失敗しました');
        } finally {
            this.enableAllBGMButtons();
        }
    }

    // フィーバーBGM再生
    async playFeverBGM() {
        if (!this.isInitialized) return;
        
        // ボタンを一時的に無効化して重複クリックを防止
        this.disableAllBGMButtons();
        
        try {
            console.log('フィーバーBGM切り替え開始');
            // 確実に現在のBGMを停止
            this.audioManager.stopCurrentBGM();
            await new Promise(resolve => setTimeout(resolve, 200)); // 停止完了待機
            
            await this.audioManager.startFeverTime();
            this.playbackStatus.innerHTML = '<span class="success">⚡ フィーバーBGM再生中...</span>';
            console.log('フィーバーBGM再生完了');
        } catch (error) {
            console.error('フィーバーBGM再生エラー:', error);
            this.showError('フィーバーBGMの再生に失敗しました');
        } finally {
            this.enableAllBGMButtons();
        }
    }

    // BGM停止
    stopBGM() {
        if (!this.isInitialized) return;
        
        try {
            this.audioManager.stopCurrentBGM();
            this.playbackStatus.innerHTML = '<span>🔇 BGM停止中</span>';
            console.log('BGM停止');
        } catch (error) {
            console.error('BGM停止エラー:', error);
            this.showError('BGMの停止に失敗しました');
        }
    }

    // 端末情報を表示（Version 1.1.0 - 詳細情報追加）
    displayDeviceInfo() {
        const userAgent = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isAndroid = /Android/i.test(userAgent);
        
        let deviceType = 'デスクトップ';
        let deviceIcon = '🖥️';
        if (isIOS) {
            deviceType = 'iOS';
            deviceIcon = '📱';
        } else if (isAndroid) {
            deviceType = 'Android';
            deviceIcon = '🤖';
        } else if (isMobile) {
            deviceType = 'モバイル';
            deviceIcon = '📱';
        }
        
        const audioContextSupport = window.AudioContext || window.webkitAudioContext ? '✓' : '✗';
        
        // Chrome バージョン情報（Android音声問題のデバッグ用）
        const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
        const chromeVersion = chromeMatch ? chromeMatch[1] : 'N/A';
        
        this.deviceInfo.innerHTML = `
            ${deviceIcon} 端末: ${deviceType} | AudioContext: ${audioContextSupport}<br>
            Chrome: v${chromeVersion} | ${isMobile ? 'モバイル自動再生ポリシー対応' : 'デスクトップ環境'}<br>
            <small style="opacity: 0.7;">Version 1.1.0 - Android音声特別対応</small>
        `;
        
        // デバッグ用コンソール出力
        console.log('=== 端末情報デバッグ (Version 1.1.0) ===');
        console.log('UserAgent:', userAgent);
        console.log('isMobile:', isMobile);
        console.log('isAndroid:', isAndroid);
        console.log('isIOS:', isIOS);
        console.log('Chrome Version:', chromeVersion);
        console.log('AudioContext Support:', audioContextSupport);
    }

    // エラー表示
    showError(message) {
        this.audioStatus.style.display = 'block';
        this.audioStatus.innerHTML = `<span class="error">✗ ${message}</span>`;
        this.loadingStatus.style.display = 'none';
    }

    // 全BGMボタンを無効化（重複クリック防止）
    disableAllBGMButtons() {
        this.playChijouBtn.disabled = true;
        this.playJigokuBtn.disabled = true;
        this.playFeverBtn.disabled = true;
        this.stopBtn.disabled = true;
    }

    // 全BGMボタンを有効化
    enableAllBGMButtons() {
        this.playChijouBtn.disabled = false;
        this.playJigokuBtn.disabled = false;
        this.playFeverBtn.disabled = false;
        this.stopBtn.disabled = false;
    }

    // バックグラウンド再生防止の設定 (Version 1.1.2 - バックグラウンド再生停止)
    setupBackgroundPlayPrevention() {
        // Page Visibility API を使用してタブの可視性を監視
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // タブが非表示になった時（他のタブに移動、最小化など）
                console.log('タブが非表示になりました - 音声を停止');
                this.pauseOnBackground();
            } else {
                // タブが表示された時
                console.log('タブが表示されました');
                this.resumeFromBackground();
            }
        });

        // window.onblur/onfocus でもバックアップ
        window.addEventListener('blur', () => {
            console.log('ウィンドウがフォーカスを失いました - 音声を停止');
            this.pauseOnBackground();
        });

        window.addEventListener('focus', () => {
            console.log('ウィンドウがフォーカスを取得しました');
            this.resumeFromBackground();
        });

        // モバイルでのページ離脱時
        window.addEventListener('pagehide', () => {
            console.log('ページが隠されました - 音声を停止');
            this.pauseOnBackground();
        });

        window.addEventListener('pageshow', () => {
            console.log('ページが表示されました');
            this.resumeFromBackground();
        });
    }

    // バックグラウンド時の音声停止 (Version 1.1.5 - 初期化前処理防止)
    pauseOnBackground() {
        // 初期化完了前は何もしない（重要：STARTボタン押下前の誤動作防止）
        if (!this.audioManager || !this.isInitialized) {
            console.log('バックグラウンド処理スキップ: 音声未初期化');
            return;
        }
        
        try {
            this.audioManager.stopCurrentBGM();
            if (this.playbackStatus.style.display !== 'none') {
                this.playbackStatus.innerHTML = '<span style="color: #ffa500;">⏸️ バックグラウンド時は音声を停止中</span>';
            }
            console.log('バックグラウンド再生防止: 音声停止');
        } catch (error) {
            console.error('バックグラウンド音声停止エラー:', error);
        }
    }

    // フォアグラウンド復帰時の処理 (Version 1.1.5 - 初期化前処理防止)
    resumeFromBackground() {
        // 初期化完了前は何もしない（重要：STARTボタン押下前の誤動作防止）
        if (!this.audioManager || !this.isInitialized) {
            console.log('フォアグラウンド復帰処理スキップ: 音声未初期化');
            return;
        }
        
        // 自動再開はしない（ユーザーが手動でBGMボタンを押すまで待機）
        if (this.playbackStatus.style.display !== 'none') {
            this.playbackStatus.innerHTML = '<span style="color: #87ceeb;">🎵 BGMボタンを押して再生を再開してください</span>';
        }
        console.log('フォアグラウンド復帰: 手動再開待機');
    }
}

// ページ読み込み完了後にデモを開始
document.addEventListener('DOMContentLoaded', () => {
    new SoundTestDemo();
});

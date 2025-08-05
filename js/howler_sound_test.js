import { HowlerSoundManager } from './howlerSoundManager.js';

class HowlerSoundTestDemo {
    constructor() {
        this.soundManager = null;
        this.isInitialized = false;
        this.loadingStatus = document.getElementById('loadingStatus');
        this.audioStatus = document.getElementById('audioStatus');
        this.startButton = document.getElementById('startButton');
        this.playbackStatus = document.getElementById('playbackStatus');
        this.bgmControls = document.getElementById('bgmControls');
        this.deviceInfo = document.getElementById('deviceInfo');
        this.volumeControls = document.getElementById('volumeControls');
        
        // ボタンの参照を取得
        this.playChijouBtn = document.getElementById('playChijouBtn');
        this.playJigokuBtn = document.getElementById('playJigokuBtn');
        this.playFeverBtn = document.getElementById('playFeverBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.muteBtn = document.getElementById('muteBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        
        // バックグラウンド再生防止の設定
        this.setupBackgroundPlayPrevention();
        
        this.init();
    }

    async init() {
        console.log('HowlerJS音声テストデモ初期化開始 - Version 2.0.0');
        
        // 端末情報を表示
        this.displayDeviceInfo();
        
        try {
            // HowlerSoundManagerを初期化
            this.soundManager = new HowlerSoundManager();
            
            // 音声ファイルの読み込み
            await this.soundManager.preloadSounds();
            
            // 読み込み完了後の処理
            this.onAudioLoaded();
            
        } catch (error) {
            console.error('HowlerJS音声初期化エラー:', error);
            this.showError('HowlerJS音声の初期化に失敗しました: ' + error.message);
        }
    }

    // 音声読み込み完了時の処理
    onAudioLoaded() {
        // ローディング表示を隠す
        this.loadingStatus.style.display = 'none';
        
        // 準備完了表示を表示
        this.audioStatus.style.display = 'block';
        this.audioStatus.innerHTML = '<span class="success">✓ HowlerJS音声の準備が完了しました！STARTボタンを押してください</span>';
        
        // STARTボタンを有効化
        this.startButton.disabled = false;
        
        // STARTボタンのイベントリスナーを設定
        this.startButton.addEventListener('click', () => this.onStartClick());
    }

    // STARTボタンクリック時の処理
    async onStartClick() {
        console.log('HowlerJS STARTボタンがクリックされました - Version 2.0.0');
        
        try {
            // ボタンを無効化
            this.startButton.disabled = true;
            this.startButton.textContent = '初期化中...';
            
            // HowlerSoundManagerの音声初期化を実行
            console.log('HowlerJS音声初期化開始...');
            await this.soundManager.initializeAudio();
            
            console.log('HowlerJS音声初期化完了');
            
            // ボタンテキストを更新
            this.startButton.textContent = '初期化完了✓';
            
            // UIを更新
            this.audioStatus.innerHTML = '<span class="success">✓ HowlerJS音声コンテキストが有効化されました！</span>';
            
            // BGM再生開始
            console.log('HowlerJS BGM再生準備...');
            await this.startBGM();
            
            // コントロールを表示
            this.showControls();
            
            // ボタンを非表示にして、初期化完了を明確に示す
            this.startButton.style.display = 'none';
            
            this.isInitialized = true;
            console.log('HowlerJS全ての初期化処理完了');
            
        } catch (error) {
            console.error('HowlerJS音声初期化エラー:', error);
            this.showError('HowlerJS音声の初期化に失敗しました: ' + error.message);
            
            // ボタンを再度有効化
            this.startButton.disabled = false;
            this.startButton.textContent = 'START';
        }
    }

    // BGM再生開始
    async startBGM() {
        try {
            console.log('HowlerJS地上BGM再生開始');
            await this.soundManager.playBGM('chijou');
            
            // 再生状況を表示
            this.playbackStatus.style.display = 'block';
            this.playbackStatus.innerHTML = '<span class="success">🎵 HowlerJS地上BGM再生中...</span>';
            
        } catch (error) {
            console.error('HowlerJSBGM再生エラー:', error);
            this.showError('HowlerJSBGMの再生に失敗しました: ' + error.message);
        }
    }

    // コントロールを表示
    showControls() {
        this.bgmControls.style.display = 'block';
        this.volumeControls.style.display = 'block';
        
        // 各ボタンのイベントリスナーを設定（重複防止のため一度だけ設定）
        if (!this.controlsInitialized) {
            this.playChijouBtn.addEventListener('click', () => this.playChijouBGM());
            this.playJigokuBtn.addEventListener('click', () => this.playJigokuBGM());
            this.playFeverBtn.addEventListener('click', () => this.playFeverBGM());
            this.stopBtn.addEventListener('click', () => this.stopBGM());
            this.muteBtn.addEventListener('click', () => this.toggleMute());
            this.volumeSlider.addEventListener('input', (e) => this.changeVolume(e.target.value));
            this.controlsInitialized = true;
        }
    }

    // 地上BGM再生
    async playChijouBGM() {
        if (!this.isInitialized) return;
        
        this.disableAllBGMButtons();
        
        try {
            console.log('HowlerJS地上BGM切り替え開始');
            await this.soundManager.playBGM('chijou');
            this.playbackStatus.innerHTML = '<span class="success">🌍 HowlerJS地上BGM再生中...</span>';
            console.log('HowlerJS地上BGM再生完了');
        } catch (error) {
            console.error('HowlerJS地上BGM再生エラー:', error);
            this.showError('HowlerJS地上BGMの再生に失敗しました');
        } finally {
            this.enableAllBGMButtons();
        }
    }

    // 地獄BGM再生
    async playJigokuBGM() {
        if (!this.isInitialized) return;
        
        this.disableAllBGMButtons();
        
        try {
            console.log('HowlerJS地獄BGM切り替え開始');
            await this.soundManager.playBGM('jigoku');
            this.playbackStatus.innerHTML = '<span class="success">🔥 HowlerJS地獄BGM再生中...</span>';
            console.log('HowlerJS地獄BGM再生完了');
        } catch (error) {
            console.error('HowlerJS地獄BGM再生エラー:', error);
            this.showError('HowlerJS地獄BGMの再生に失敗しました');
        } finally {
            this.enableAllBGMButtons();
        }
    }

    // フィーバーBGM再生
    async playFeverBGM() {
        if (!this.isInitialized) return;
        
        this.disableAllBGMButtons();
        
        try {
            console.log('HowlerJSフィーバーBGM切り替え開始');
            await this.soundManager.playBGM('fever');
            this.playbackStatus.innerHTML = '<span class="success">⚡ HowlerJSフィーバーBGM再生中...</span>';
            console.log('HowlerJSフィーバーBGM再生完了');
        } catch (error) {
            console.error('HowlerJSフィーバーBGM再生エラー:', error);
            this.showError('HowlerJSフィーバーBGMの再生に失敗しました');
        } finally {
            this.enableAllBGMButtons();
        }
    }

    // BGM停止
    stopBGM() {
        if (!this.isInitialized) return;
        
        try {
            this.soundManager.stopCurrentBGM();
            this.playbackStatus.innerHTML = '<span>🔇 HowlerJSBGM停止中</span>';
            console.log('HowlerJSBGM停止');
        } catch (error) {
            console.error('HowlerJSBGM停止エラー:', error);
            this.showError('HowlerJSBGMの停止に失敗しました');
        }
    }

    // ミュート切り替え
    toggleMute() {
        if (!this.isInitialized) return;
        
        try {
            const isMuted = this.soundManager.toggleMute();
            this.muteBtn.textContent = isMuted ? '🔊 音声ON' : '🔇 ミュート';
            console.log('HowlerJSミュート切り替え:', isMuted);
        } catch (error) {
            console.error('HowlerJSミュート切り替えエラー:', error);
        }
    }

    // 音量変更
    changeVolume(volume) {
        if (!this.isInitialized) return;
        
        try {
            const volumeValue = parseFloat(volume);
            this.soundManager.setMasterVolume(volumeValue);
            console.log('HowlerJS音量変更:', volumeValue);
        } catch (error) {
            console.error('HowlerJS音量変更エラー:', error);
        }
    }

    // 端末情報を表示
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
        const howlerSupport = typeof Howl !== 'undefined' ? '✓' : '✗';
        
        this.deviceInfo.innerHTML = `
            ${deviceIcon} 端末: ${deviceType} | AudioContext: ${audioContextSupport} | HowlerJS: ${howlerSupport}<br>
            ${isMobile ? 'モバイル対応HowlerJS音声管理' : 'デスクトップHowlerJS環境'}<br>
            <small style="opacity: 0.7;">Version 2.0.0 - HowlerJS音声管理システム</small>
        `;
        
        // デバッグ用コンソール出力
        console.log('=== HowlerJS端末情報デバッグ (Version 2.0.0) ===');
        console.log('UserAgent:', userAgent);
        console.log('isMobile:', isMobile);
        console.log('isAndroid:', isAndroid);
        console.log('isIOS:', isIOS);
        console.log('AudioContext Support:', audioContextSupport);
        console.log('HowlerJS Support:', howlerSupport);
    }

    // エラー表示
    showError(message) {
        this.audioStatus.style.display = 'block';
        this.audioStatus.innerHTML = `<span class="error">✗ ${message}</span>`;
        this.loadingStatus.style.display = 'none';
    }

    // 全BGMボタンを無効化
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

    // バックグラウンド再生防止の設定
    setupBackgroundPlayPrevention() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('HowlerJSタブが非表示になりました - 音声を停止');
                this.pauseOnBackground();
            } else {
                console.log('HowlerJSタブが表示されました');
                this.resumeFromBackground();
            }
        });

        window.addEventListener('blur', () => {
            console.log('HowlerJSウィンドウがフォーカスを失いました - 音声を停止');
            this.pauseOnBackground();
        });

        window.addEventListener('focus', () => {
            console.log('HowlerJSウィンドウがフォーカスを取得しました');
            this.resumeFromBackground();
        });

        window.addEventListener('pagehide', () => {
            console.log('HowlerJSページが隠されました - 音声を停止');
            this.pauseOnBackground();
        });

        window.addEventListener('pageshow', () => {
            console.log('HowlerJSページが表示されました');
            this.resumeFromBackground();
        });
    }

    // バックグラウンド時の音声停止
    pauseOnBackground() {
        if (!this.soundManager || !this.isInitialized) {
            console.log('HowlerJSバックグラウンド処理スキップ: 音声未初期化');
            return;
        }
        
        try {
            this.soundManager.pauseCurrentBGM();
            if (this.playbackStatus.style.display !== 'none') {
                this.playbackStatus.innerHTML = '<span style="color: #ffa500;">⏸️ HowlerJSバックグラウンド時は音声を停止中</span>';
            }
            console.log('HowlerJSバックグラウンド再生防止: 音声停止');
        } catch (error) {
            console.error('HowlerJSバックグラウンド音声停止エラー:', error);
        }
    }

    // フォアグラウンド復帰時の処理
    resumeFromBackground() {
        if (!this.soundManager || !this.isInitialized) {
            console.log('HowlerJSフォアグラウンド復帰処理スキップ: 音声未初期化');
            return;
        }
        
        if (this.playbackStatus.style.display !== 'none') {
            this.playbackStatus.innerHTML = '<span style="color: #87ceeb;">🎵 HowlerJSBGMボタンを押して再生を再開してください</span>';
        }
        console.log('HowlerJSフォアグラウンド復帰: 手動再開待機');
    }
}

// ページ読み込み完了後にデモを開始
document.addEventListener('DOMContentLoaded', () => {
    new HowlerSoundTestDemo();
});

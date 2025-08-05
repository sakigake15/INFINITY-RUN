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

    // STARTボタンクリック時の処理
    async onStartClick() {
        console.log('STARTボタンがクリックされました');
        
        try {
            // ボタンを無効化
            this.startButton.disabled = true;
            this.startButton.textContent = '初期化中...';
            
            // AudioManagerの音声初期化を実行（ユーザーインタラクション後）
            await this.audioManager.initializeAudio();
            
            console.log('音声初期化完了');
            
            // UIを更新
            this.audioStatus.innerHTML = '<span class="success">✓ 音声コンテキストが有効化されました！</span>';
            
            // BGM再生開始
            await this.startBGM();
            
            // BGMコントロールを表示
            this.showBGMControls();
            
            this.isInitialized = true;
            
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
        
        // 各ボタンのイベントリスナーを設定
        this.playChijouBtn.addEventListener('click', () => this.playChijouBGM());
        this.playJigokuBtn.addEventListener('click', () => this.playJigokuBGM());
        this.playFeverBtn.addEventListener('click', () => this.playFeverBGM());
        this.stopBtn.addEventListener('click', () => this.stopBGM());
    }

    // 地上BGM再生
    async playChijouBGM() {
        if (!this.isInitialized) return;
        
        try {
            await this.audioManager.playChijouBGM();
            this.playbackStatus.innerHTML = '<span class="success">🌍 地上BGM再生中...</span>';
            console.log('地上BGM再生');
        } catch (error) {
            console.error('地上BGM再生エラー:', error);
            this.showError('地上BGMの再生に失敗しました');
        }
    }

    // 地獄BGM再生
    async playJigokuBGM() {
        if (!this.isInitialized) return;
        
        try {
            await this.audioManager.playJigokuBGM();
            this.playbackStatus.innerHTML = '<span class="success">🔥 地獄BGM再生中...</span>';
            console.log('地獄BGM再生');
        } catch (error) {
            console.error('地獄BGM再生エラー:', error);
            this.showError('地獄BGMの再生に失敗しました');
        }
    }

    // フィーバーBGM再生
    async playFeverBGM() {
        if (!this.isInitialized) return;
        
        try {
            await this.audioManager.startFeverTime();
            this.playbackStatus.innerHTML = '<span class="success">⚡ フィーバーBGM再生中...</span>';
            console.log('フィーバーBGM再生');
        } catch (error) {
            console.error('フィーバーBGM再生エラー:', error);
            this.showError('フィーバーBGMの再生に失敗しました');
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

    // 端末情報を表示
    displayDeviceInfo() {
        const userAgent = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isAndroid = /Android/i.test(userAgent);
        
        let deviceType = 'デスクトップ';
        if (isIOS) {
            deviceType = 'iOS';
        } else if (isAndroid) {
            deviceType = 'Android';
        } else if (isMobile) {
            deviceType = 'モバイル';
        }
        
        const audioContextSupport = window.AudioContext || window.webkitAudioContext ? '✓' : '✗';
        
        this.deviceInfo.innerHTML = `
            端末: ${deviceType} | AudioContext: ${audioContextSupport}<br>
            ${isMobile ? '📱 モバイル端末での自動再生ポリシー対応' : '🖥️ デスクトップ環境'}
        `;
    }

    // エラー表示
    showError(message) {
        this.audioStatus.style.display = 'block';
        this.audioStatus.innerHTML = `<span class="error">✗ ${message}</span>`;
        this.loadingStatus.style.display = 'none';
    }
}

// ページ読み込み完了後にデモを開始
document.addEventListener('DOMContentLoaded', () => {
    new SoundTestDemo();
});

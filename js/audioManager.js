export class AudioManager {
    constructor() {
        // BGM音声ファイルを読み込み
        this.chijouBGM = new Audio('chijou.mp3');
        this.jigokuBGM = new Audio('jigoku.mp3');
        this.feverBGM = new Audio('fever.mp3');
        
        // BGMの設定
        this.chijouBGM.loop = true;
        this.jigokuBGM.loop = true;
        this.feverBGM.loop = true;
        this.chijouBGM.volume = 0.3;
        this.jigokuBGM.volume = 0.3;
        this.feverBGM.volume = 0.4;
        
        // モバイル対応のための設定
        this.chijouBGM.preload = 'auto';
        this.jigokuBGM.preload = 'auto';
        this.feverBGM.preload = 'auto';
        
        // iOS Safari対応
        this.chijouBGM.setAttribute('playsinline', '');
        this.jigokuBGM.setAttribute('playsinline', '');
        this.feverBGM.setAttribute('playsinline', '');
        
        this.currentBGM = null;
        this.previousBGM = null; // フィーバータイム前のBGMを記録
        this.isPlaying = false;
        this.isFeverTime = false;
        this.isInitialized = false; // 音声コンテキスト初期化フラグ
        this.isUnlocked = false; // 音声アンロック状態
        this.audioContext = null;
        this.initializationAttempts = 0;
        this.maxInitializationAttempts = 3;
        
        // モバイル検出
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        this.initializeAudioContext();
        this.setupTouchUnlock();
    }

    // AudioContextの初期化（モバイル対応）
    async initializeAudioContext() {
        try {
            // Web Audio APIのサポート確認
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            if (window.AudioContext) {
                this.audioContext = new AudioContext();
            }
        } catch (error) {
            console.log('AudioContext初期化エラー:', error);
        }
    }

    // タッチアンロック設定（モバイル対応）
    setupTouchUnlock() {
        if (!this.isMobile) return;
        
        const unlockAudio = async () => {
            if (this.isUnlocked) return;
            
            try {
                console.log('音声アンロック処理開始');
                await this.unlockAudio();
                this.isUnlocked = true;
                console.log('音声アンロック完了');
                
                // イベントリスナーを削除
                document.removeEventListener('touchstart', unlockAudio);
                document.removeEventListener('touchend', unlockAudio);
                document.removeEventListener('click', unlockAudio);
            } catch (error) {
                console.log('音声アンロックエラー:', error);
            }
        };
        
        // 複数のイベントでアンロックを試行
        document.addEventListener('touchstart', unlockAudio, { once: true });
        document.addEventListener('touchend', unlockAudio, { once: true });
        document.addEventListener('click', unlockAudio, { once: true });
    }

    // 音声アンロック処理
    async unlockAudio() {
        const audioFiles = [this.chijouBGM, this.jigokuBGM, this.feverBGM];
        
        for (const audio of audioFiles) {
            try {
                const originalVolume = audio.volume;
                audio.volume = 0;
                await audio.play();
                audio.pause();
                audio.currentTime = 0;
                audio.volume = originalVolume;
            } catch (error) {
                console.log('個別音声アンロックエラー:', error);
            }
        }
        
        // AudioContextのレジューム
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    // ユーザーインタラクション後の音声初期化（シンプル版）
    async initializeAudio() {
        if (this.isInitialized) return;
        
        try {
            console.log('音声初期化開始');
            
            // AudioContextの状態確認・復旧
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // モバイルでの音声準備
            if (this.isMobile) {
                const audioFiles = [this.chijouBGM, this.jigokuBGM, this.feverBGM];
                
                for (const audio of audioFiles) {
                    try {
                        audio.muted = true;
                        await audio.play();
                        audio.pause();
                        audio.muted = false;
                        audio.currentTime = 0;
                    } catch (error) {
                        console.log('音声準備エラー:', error);
                    }
                }
            }
            
            this.isInitialized = true;
            console.log('音声初期化完了');
        } catch (error) {
            console.log('音声初期化エラー:', error);
        }
    }

    // iOS用音声準備
    async prepareIOSAudio() {
        const audioFiles = [this.chijouBGM, this.jigokuBGM, this.feverBGM];
        
        for (const audio of audioFiles) {
            try {
                // iOSでは明示的にloadを呼ぶ
                audio.load();
                
                // 一時的にミュートして再生テスト
                const originalVolume = audio.volume;
                audio.volume = 0;
                audio.muted = true;
                
                await audio.play();
                audio.pause();
                audio.currentTime = 0;
                
                audio.muted = false;
                audio.volume = originalVolume;
                
                console.log('iOS音声準備完了:', audio.src);
            } catch (error) {
                console.log('iOS音声準備エラー:', audio.src, error);
            }
        }
    }

    // Android用音声準備
    async prepareAndroidAudio() {
        const audioFiles = [this.chijouBGM, this.jigokuBGM, this.feverBGM];
        
        for (const audio of audioFiles) {
            try {
                audio.muted = true;
                await audio.play();
                audio.pause();
                audio.muted = false;
                audio.currentTime = 0;
                console.log('Android音声準備完了:', audio.src);
            } catch (error) {
                console.log('Android音声準備エラー:', audio.src, error);
            }
        }
    }

    // デスクトップ用音声準備
    async prepareDesktopAudio() {
        const audioFiles = [this.chijouBGM, this.jigokuBGM, this.feverBGM];
        
        for (const audio of audioFiles) {
            try {
                audio.load();
                console.log('デスクトップ音声準備完了:', audio.src);
            } catch (error) {
                console.log('デスクトップ音声準備エラー:', audio.src, error);
            }
        }
    }

    // 地上世界のBGMを再生
    async playChijouBGM() {
        if (!this.isInitialized) {
            await this.initializeAudio();
        }
        
        this.stopCurrentBGM();
        this.currentBGM = this.chijouBGM;
        this.currentBGM.currentTime = 0;
        
        try {
            await this.currentBGM.play();
            this.isPlaying = true;
            console.log('地上BGM再生開始');
        } catch (error) {
            console.log('地上BGM再生エラー:', error);
            this.isPlaying = false;
        }
    }

    // 地獄世界のBGMを再生
    async playJigokuBGM() {
        if (!this.isInitialized) {
            await this.initializeAudio();
        }
        
        this.stopCurrentBGM();
        this.currentBGM = this.jigokuBGM;
        this.currentBGM.currentTime = 0;
        
        try {
            await this.currentBGM.play();
            this.isPlaying = true;
            console.log('地獄BGM再生開始');
        } catch (error) {
            console.log('地獄BGM再生エラー:', error);
            this.isPlaying = false;
        }
    }

    // 現在のBGMを停止
    stopCurrentBGM() {
        if (this.currentBGM) {
            this.currentBGM.pause();
            this.currentBGM.currentTime = 0;
        }
        this.isPlaying = false;
    }

    // 世界に応じてBGMを切り替え
    switchBGM(isHellWorld) {
        // フィーバータイム中は世界切り替えBGMを無視
        if (this.isFeverTime) {
            // previousBGMを更新して、フィーバータイム終了後に正しいBGMに戻るようにする
            this.previousBGM = isHellWorld ? this.jigokuBGM : this.chijouBGM;
            return;
        }
        
        if (isHellWorld) {
            this.playJigokuBGM();
        } else {
            this.playChijouBGM();
        }
    }

    // ゲーム開始時にBGMを開始
    startBGM(isHellWorld = false) {
        this.switchBGM(isHellWorld);
    }

    // BGMを一時停止
    pauseBGM() {
        if (this.currentBGM && this.isPlaying) {
            this.currentBGM.pause();
            this.isPlaying = false;
        }
    }

    // BGMを再開
    resumeBGM() {
        if (this.currentBGM && !this.isPlaying) {
            this.currentBGM.play().catch(error => {
                console.log('BGM再開エラー:', error);
            });
            this.isPlaying = true;
        }
    }

    // フィーバータイム開始
    async startFeverTime() {
        if (this.isFeverTime) return; // 既にフィーバータイム中の場合は何もしない
        
        if (!this.isInitialized) {
            await this.initializeAudio();
        }
        
        this.isFeverTime = true;
        this.previousBGM = this.currentBGM; // 現在のBGMを記録
        
        // フィーバーBGMを再生
        this.stopCurrentBGM();
        this.currentBGM = this.feverBGM;
        this.currentBGM.currentTime = 0;
        
        try {
            await this.currentBGM.play();
            this.isPlaying = true;
            console.log('フィーバーBGM再生開始');
        } catch (error) {
            console.log('フィーバーBGM再生エラー:', error);
            this.isPlaying = false;
        }
    }

    // フィーバータイム終了
    async endFeverTime() {
        if (!this.isFeverTime) return; // フィーバータイム中でない場合は何もしない
        
        this.isFeverTime = false;
        
        // 前のBGMに戻す
        this.stopCurrentBGM();
        if (this.previousBGM) {
            this.currentBGM = this.previousBGM;
            this.currentBGM.currentTime = 0;
            
            try {
                await this.currentBGM.play();
                this.isPlaying = true;
                console.log('BGM復帰再生開始');
            } catch (error) {
                console.log('BGM復帰再生エラー:', error);
                this.isPlaying = false;
            }
            this.previousBGM = null;
        }
    }
}

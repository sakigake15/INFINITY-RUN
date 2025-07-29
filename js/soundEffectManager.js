export class SoundEffectManager {
    constructor() {
        // SE音声ファイルを読み込み
        this.coinSound = new Audio('coin1.mp3');
        this.coinSound2 = new Audio('coin2.mp3');
        this.deathSound = new Audio('death.mp3');
        this.changeSound = new Audio('change.mp3');
        
        // SE音の設定
        this.coinSound.volume = 0.3;
        this.coinSound2.volume = 0.3;
        this.deathSound.volume = 0.7;
        this.changeSound.volume = 0.6;
        
        // モバイル対応のための設定
        this.coinSound.preload = 'auto';
        this.coinSound2.preload = 'auto';
        this.deathSound.preload = 'auto';
        this.changeSound.preload = 'auto';
        
        // iOS Safari対応
        this.coinSound.setAttribute('playsinline', '');
        this.coinSound2.setAttribute('playsinline', '');
        this.deathSound.setAttribute('playsinline', '');
        this.changeSound.setAttribute('playsinline', '');
        
        this.isInitialized = false;
        this.isUnlocked = false;
        this.initializationAttempts = 0;
        this.maxInitializationAttempts = 3;
        
        // モバイル検出
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        this.setupTouchUnlock();
    }

    // タッチアンロック設定（モバイル対応）
    setupTouchUnlock() {
        if (!this.isMobile) return;
        
        const unlockSounds = async () => {
            if (this.isUnlocked) return;
            
            try {
                console.log('SE音アンロック処理開始');
                await this.unlockSounds();
                this.isUnlocked = true;
                console.log('SE音アンロック完了');
                
                // イベントリスナーを削除
                document.removeEventListener('touchstart', unlockSounds);
                document.removeEventListener('touchend', unlockSounds);
                document.removeEventListener('click', unlockSounds);
            } catch (error) {
                console.log('SE音アンロックエラー:', error);
            }
        };
        
        // 複数のイベントでアンロックを試行
        document.addEventListener('touchstart', unlockSounds, { once: true });
        document.addEventListener('touchend', unlockSounds, { once: true });
        document.addEventListener('click', unlockSounds, { once: true });
    }

    // SE音アンロック処理
    async unlockSounds() {
        const soundFiles = [this.coinSound, this.coinSound2, this.deathSound, this.changeSound];
        
        for (const sound of soundFiles) {
            try {
                const originalVolume = sound.volume;
                sound.volume = 0;
                await sound.play();
                sound.pause();
                sound.currentTime = 0;
                sound.volume = originalVolume;
            } catch (error) {
                console.log('個別SE音アンロックエラー:', error);
            }
        }
    }

    // ユーザーインタラクション後のSE音初期化（シンプル版）
    async initializeSounds() {
        if (this.isInitialized) return;
        
        try {
            console.log('SE音初期化開始');
            
            // モバイルでのSE音準備
            if (this.isMobile) {
                const soundFiles = [this.coinSound, this.coinSound2, this.deathSound, this.changeSound];
                
                for (const sound of soundFiles) {
                    try {
                        sound.muted = true;
                        await sound.play();
                        sound.pause();
                        sound.muted = false;
                        sound.currentTime = 0;
                    } catch (error) {
                        console.log('SE音準備エラー:', error);
                    }
                }
            }
            
            this.isInitialized = true;
            console.log('SE音初期化完了');
        } catch (error) {
            console.log('SE音初期化エラー:', error);
        }
    }

    // iOS用SE音準備
    async prepareIOSSounds() {
        const soundFiles = [this.coinSound, this.coinSound2, this.deathSound, this.changeSound];
        
        for (const sound of soundFiles) {
            try {
                // iOSでは明示的にloadを呼ぶ
                sound.load();
                
                // 一時的にミュートして再生テスト
                const originalVolume = sound.volume;
                sound.volume = 0;
                sound.muted = true;
                
                await sound.play();
                sound.pause();
                sound.currentTime = 0;
                
                sound.muted = false;
                sound.volume = originalVolume;
                
                console.log('iOS SE音準備完了:', sound.src);
            } catch (error) {
                console.log('iOS SE音準備エラー:', sound.src, error);
            }
        }
    }

    // Android用SE音準備
    async prepareAndroidSounds() {
        const soundFiles = [this.coinSound, this.coinSound2, this.deathSound, this.changeSound];
        
        for (const sound of soundFiles) {
            try {
                sound.muted = true;
                await sound.play();
                sound.pause();
                sound.muted = false;
                sound.currentTime = 0;
                console.log('Android SE音準備完了:', sound.src);
            } catch (error) {
                console.log('Android SE音準備エラー:', sound.src, error);
            }
        }
    }

    // デスクトップ用SE音準備
    async prepareDesktopSounds() {
        const soundFiles = [this.coinSound, this.coinSound2, this.deathSound, this.changeSound];
        
        for (const sound of soundFiles) {
            try {
                sound.load();
                console.log('デスクトップSE音準備完了:', sound.src);
            } catch (error) {
                console.log('デスクトップSE音準備エラー:', sound.src, error);
            }
        }
    }

    // 地上コイン音を再生
    async playCoinSound() {
        if (!this.isInitialized) {
            await this.initializeSounds();
        }
        
        try {
            this.coinSound.currentTime = 0;
            await this.coinSound.play();
        } catch (error) {
            console.log('地上コイン音声再生エラー:', error);
        }
    }

    // 地獄コイン音を再生
    async playCoinSound2() {
        if (!this.isInitialized) {
            await this.initializeSounds();
        }
        
        try {
            this.coinSound2.currentTime = 0;
            await this.coinSound2.play();
        } catch (error) {
            console.log('地獄コイン音声再生エラー:', error);
        }
    }

    // 死亡音を再生
    async playDeathSound() {
        if (!this.isInitialized) {
            await this.initializeSounds();
        }
        
        try {
            this.deathSound.currentTime = 0;
            await this.deathSound.play();
        } catch (error) {
            console.log('死亡音声再生エラー:', error);
        }
    }

    // 世界切り替え音を再生
    async playChangeSound() {
        if (!this.isInitialized) {
            await this.initializeSounds();
        }
        
        try {
            this.changeSound.currentTime = 0;
            await this.changeSound.play();
        } catch (error) {
            console.log('世界切り替え音声再生エラー:', error);
        }
    }
}

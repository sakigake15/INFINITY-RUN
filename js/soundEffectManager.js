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

    // ユーザーインタラクション後のSE音初期化（改善版）
    async initializeSounds() {
        if (this.isInitialized && this.initializationAttempts < this.maxInitializationAttempts) {
            return;
        }
        
        this.initializationAttempts++;
        
        try {
            console.log(`SE音初期化開始 (試行回数: ${this.initializationAttempts})`);
            
            // モバイルでのより確実なSE音準備
            if (this.isMobile) {
                // iOS特有の処理
                if (this.isIOS) {
                    await this.prepareIOSSounds();
                } else {
                    await this.prepareAndroidSounds();
                }
            } else {
                // デスクトップでのSE音準備
                await this.prepareDesktopSounds();
            }
            
            this.isInitialized = true;
            console.log('SE音初期化完了');
            
        } catch (error) {
            console.log('SE音初期化エラー:', error);
            
            // 再試行ロジック
            if (this.initializationAttempts < this.maxInitializationAttempts) {
                console.log('SE音初期化を再試行します...');
                setTimeout(() => this.initializeSounds(), 1000);
            }
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

    // 音声プールから利用可能な音声オブジェクトを取得
    getAvailableSound(originalSound) {
        // 元の音声が再生中でない場合はそのまま使用
        if (originalSound.paused || originalSound.ended) {
            return originalSound;
        }
        
        // 新しい音声オブジェクトを作成（重複再生対応）
        const newSound = originalSound.cloneNode();
        newSound.volume = originalSound.volume;
        return newSound;
    }

    // 音声再生の共通処理（信頼性向上）
    async playSound(sound, soundName) {
        if (!this.isInitialized) {
            await this.initializeSounds();
        }
        
        try {
            const availableSound = this.getAvailableSound(sound);
            availableSound.currentTime = 0;
            
            // 再生前に音声の状態を確認
            if (availableSound.readyState >= 2) { // HAVE_CURRENT_DATA以上
                await availableSound.play();
                console.log(`${soundName}再生成功`);
            } else {
                // 音声が準備できていない場合は読み込み完了を待つ
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('音声読み込みタイムアウト'));
                    }, 3000);
                    
                    availableSound.addEventListener('canplaythrough', () => {
                        clearTimeout(timeout);
                        resolve();
                    }, { once: true });
                    
                    availableSound.load();
                });
                
                await availableSound.play();
                console.log(`${soundName}再生成功（遅延読み込み）`);
            }
        } catch (error) {
            console.log(`${soundName}再生エラー:`, error);
            
            // フォールバック: 基本的な再生を試行
            try {
                sound.currentTime = 0;
                await sound.play();
                console.log(`${soundName}フォールバック再生成功`);
            } catch (fallbackError) {
                console.log(`${soundName}フォールバック再生もエラー:`, fallbackError);
            }
        }
    }

    // 地上コイン音を再生
    async playCoinSound() {
        await this.playSound(this.coinSound, '地上コイン音');
    }

    // 地獄コイン音を再生
    async playCoinSound2() {
        await this.playSound(this.coinSound2, '地獄コイン音');
    }

    // 死亡音を再生
    async playDeathSound() {
        await this.playSound(this.deathSound, '死亡音');
    }

    // 世界切り替え音を再生
    async playChangeSound() {
        await this.playSound(this.changeSound, '世界切り替え音');
    }
}

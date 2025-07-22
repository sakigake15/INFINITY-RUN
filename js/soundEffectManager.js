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
        
        this.isInitialized = false;
        
        // モバイル検出
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // ユーザーインタラクション後のSE音初期化
    async initializeSounds() {
        if (this.isInitialized) return;
        
        try {
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

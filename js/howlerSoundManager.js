// HowlerJS音声管理クラス (Version 2.0.0 - Howler.js対応)
export class HowlerSoundManager {
    constructor() {
        // HowlerJSが読み込まれているかチェック
        if (typeof Howl === 'undefined') {
            throw new Error('HowlerJS が読み込まれていません。CDNを確認してください。');
        }

        this.bgmSounds = {};
        this.isInitialized = false;
        this.currentBGM = null;
        this.isMuted = false;
        
        // モバイル検出
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        this.isAndroid = /Android/i.test(navigator.userAgent);
        
        console.log('HowlerSoundManager初期化完了 - Version 2.0.0');
        this.displayDeviceInfo();
    }

    // 音声ファイルを事前読み込み
    async preloadSounds() {
        console.log('HowlerJS音声ファイル読み込み開始');
        
        const soundFiles = [
            { key: 'chijou', src: 'chijou.mp3', volume: 0.3, loop: true },
            { key: 'jigoku', src: 'jigoku.mp3', volume: 0.3, loop: true },
            { key: 'fever', src: 'fever.mp3', volume: 0.4, loop: true }
        ];
        
        const loadPromises = soundFiles.map(sound => {
            return new Promise((resolve, reject) => {
                console.log(`HowlerJS: ${sound.key} 読み込み開始`);
                
                this.bgmSounds[sound.key] = new Howl({
                    src: [sound.src],
                    volume: sound.volume,
                    loop: sound.loop,
                    preload: true,
                    html5: this.isMobile, // モバイルではHTML5モード使用
                    
                    onload: () => {
                        console.log(`HowlerJS: ${sound.key} 読み込み完了`);
                        resolve();
                    },
                    
                    onloaderror: (id, error) => {
                        console.error(`HowlerJS: ${sound.key} 読み込みエラー:`, error);
                        reject(new Error(`${sound.key} の読み込みに失敗: ${error}`));
                    },
                    
                    onplay: () => {
                        console.log(`HowlerJS: ${sound.key} 再生開始`);
                    },
                    
                    onpause: () => {
                        console.log(`HowlerJS: ${sound.key} 一時停止`);
                    },
                    
                    onstop: () => {
                        console.log(`HowlerJS: ${sound.key} 停止`);
                    },
                    
                    onend: () => {
                        console.log(`HowlerJS: ${sound.key} 再生終了`);
                    }
                });
            });
        });
        
        try {
            await Promise.all(loadPromises);
            console.log('HowlerJS: 全音声ファイル読み込み完了');
            return true;
        } catch (error) {
            console.error('HowlerJS: 音声ファイル読み込みエラー:', error);
            throw error;
        }
    }

    // ユーザーインタラクション後の初期化
    async initializeAudio() {
        if (this.isInitialized) {
            console.log('HowlerJS: 既に初期化済み');
            return;
        }

        try {
            console.log('HowlerJS: 音声初期化開始');
            
            // HowlerJSのAudioContextを有効化
            if (Howler.ctx && Howler.ctx.state === 'suspended') {
                await Howler.ctx.resume();
                console.log('HowlerJS: AudioContext resumed');
            }
            
            // モバイル用の音声アンロック
            if (this.isMobile) {
                await this.unlockMobileAudio();
            }
            
            this.isInitialized = true;
            console.log('HowlerJS: 音声初期化完了');
            
        } catch (error) {
            console.error('HowlerJS: 音声初期化エラー:', error);
            throw error;
        }
    }

    // モバイル音声アンロック
    async unlockMobileAudio() {
        console.log('HowlerJS: モバイル音声アンロック開始');
        
        // HowlerJSの自動アンロック機能を使用
        // 必要に応じて手動でテスト音を再生
        const testSound = new Howl({
            src: ['data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmoeAC2g9+Z0YSEGNVm+7KNZFgw+qhcAAA=='],
            volume: 0.01,
            html5: true
        });
        
        try {
            testSound.play();
            testSound.stop();
            console.log('HowlerJS: モバイル音声アンロック完了');
        } catch (error) {
            console.log('HowlerJS: モバイル音声アンロックエラー:', error);
        }
    }

    // BGM再生
    async playBGM(soundKey) {
        if (!this.isInitialized) {
            throw new Error('音声が初期化されていません。先にinitializeAudio()を呼び出してください。');
        }
        
        if (!this.bgmSounds[soundKey]) {
            throw new Error(`音声ファイル '${soundKey}' が見つかりません。`);
        }
        
        try {
            // 現在のBGMを停止
            this.stopCurrentBGM();
            
            // 新しいBGMを再生
            console.log(`HowlerJS: ${soundKey} BGM再生開始`);
            this.currentBGM = soundKey;
            this.bgmSounds[soundKey].play();
            
        } catch (error) {
            console.error(`HowlerJS: ${soundKey} BGM再生エラー:`, error);
            throw error;
        }
    }

    // 現在のBGMを停止
    stopCurrentBGM() {
        if (this.currentBGM && this.bgmSounds[this.currentBGM]) {
            console.log(`HowlerJS: ${this.currentBGM} BGM停止`);
            this.bgmSounds[this.currentBGM].stop();
        }
        this.currentBGM = null;
    }

    // BGM一時停止
    pauseCurrentBGM() {
        if (this.currentBGM && this.bgmSounds[this.currentBGM]) {
            console.log(`HowlerJS: ${this.currentBGM} BGM一時停止`);
            this.bgmSounds[this.currentBGM].pause();
        }
    }

    // BGM再開
    resumeCurrentBGM() {
        if (this.currentBGM && this.bgmSounds[this.currentBGM]) {
            console.log(`HowlerJS: ${this.currentBGM} BGM再開`);
            this.bgmSounds[this.currentBGM].play();
        }
    }

    // 世界切り替えに応じてBGMを変更
    async switchBGM(isHellWorld) {
        const targetBGM = isHellWorld ? 'jigoku' : 'chijou';
        console.log(`HowlerJS: 世界切り替え - ${targetBGM}に変更`);
        
        try {
            await this.playBGM(targetBGM);
        } catch (error) {
            console.error(`HowlerJS: 世界切り替えBGMエラー:`, error);
        }
    }

    // フィーバータイムBGM開始
    async startFeverTime() {
        console.log('HowlerJS: フィーバータイムBGM開始');
        try {
            await this.playBGM('fever');
        } catch (error) {
            console.error('HowlerJS: フィーバータイムBGMエラー:', error);
        }
    }

    // フィーバータイム終了時のBGM復帰
    async endFeverTime(gameState = null) {
        console.log('HowlerJS: フィーバータイム終了 - 通常BGMに復帰');
        
        let targetBGM = 'chijou'; // デフォルトは地上世界
        
        // GameStateが渡された場合は現在の世界に応じてBGMを決定
        if (gameState && typeof gameState.getIsHellWorld === 'function') {
            targetBGM = gameState.getIsHellWorld() ? 'jigoku' : 'chijou';
            console.log(`HowlerJS: 現在の世界 - ${gameState.getIsHellWorld() ? '地獄' : '地上'}`);
        }
        
        try {
            await this.playBGM(targetBGM);
        } catch (error) {
            console.error('HowlerJS: フィーバータイム終了BGMエラー:', error);
        }
    }

    // 音量制御
    setVolume(soundKey, volume) {
        if (this.bgmSounds[soundKey]) {
            this.bgmSounds[soundKey].volume(volume);
            console.log(`HowlerJS: ${soundKey} 音量設定: ${volume}`);
        }
    }

    // 全体音量制御
    setMasterVolume(volume) {
        Howler.volume(volume);
        console.log(`HowlerJS: マスター音量設定: ${volume}`);
    }

    // ミュート制御
    toggleMute() {
        this.isMuted = !this.isMuted;
        Howler.mute(this.isMuted);
        console.log(`HowlerJS: ミュート ${this.isMuted ? 'ON' : 'OFF'}`);
        return this.isMuted;
    }

    // 音声の状態を取得
    getSoundState(soundKey) {
        if (!this.bgmSounds[soundKey]) return null;
        
        const sound = this.bgmSounds[soundKey];
        return {
            playing: sound.playing(),
            volume: sound.volume(),
            duration: sound.duration(),
            seek: sound.seek()
        };
    }

    // 全音声停止
    stopAll() {
        console.log('HowlerJS: 全音声停止');
        Howler.stop();
        this.currentBGM = null;
    }

    // 端末情報表示
    displayDeviceInfo() {
        let deviceType = 'デスクトップ';
        if (this.isIOS) {
            deviceType = 'iOS';
        } else if (this.isAndroid) {
            deviceType = 'Android';
        } else if (this.isMobile) {
            deviceType = 'モバイル';
        }
        
        console.log('=== HowlerJS 端末情報 ===');
        console.log('端末タイプ:', deviceType);
        console.log('HowlerJS バージョン:', typeof Howler !== 'undefined' ? Howler.version : 'N/A');
        console.log('AudioContext サポート:', Howler.ctx ? 'あり' : 'なし');
        console.log('Web Audio API:', Howler.usingWebAudio ? 'あり' : 'HTML5 Audio');
        console.log('Mobile HTML5 Mode:', this.isMobile);
    }

    // リソースの解放
    destroy() {
        console.log('HowlerJS: リソース解放');
        Object.values(this.bgmSounds).forEach(sound => {
            sound.unload();
        });
        this.bgmSounds = {};
        this.currentBGM = null;
        this.isInitialized = false;
    }
}

export class AudioManager {
    constructor() {
        // BGM音声ファイルを読み込み
        this.chijouBGM = new Audio('chijou.mp3');
        this.jigokuBGM = new Audio('jigoku.mp3');
        
        // BGMの設定
        this.chijouBGM.loop = true;
        this.jigokuBGM.loop = true;
        this.chijouBGM.volume = 0.3;
        this.jigokuBGM.volume = 0.3;
        
        this.currentBGM = null;
        this.isPlaying = false;
    }

    // 地上世界のBGMを再生
    playChijouBGM() {
        this.stopCurrentBGM();
        this.currentBGM = this.chijouBGM;
        this.currentBGM.currentTime = 0;
        this.currentBGM.play().catch(error => {
            console.log('地上BGM再生エラー:', error);
        });
        this.isPlaying = true;
    }

    // 地獄世界のBGMを再生
    playJigokuBGM() {
        this.stopCurrentBGM();
        this.currentBGM = this.jigokuBGM;
        this.currentBGM.currentTime = 0;
        this.currentBGM.play().catch(error => {
            console.log('地獄BGM再生エラー:', error);
        });
        this.isPlaying = true;
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
}

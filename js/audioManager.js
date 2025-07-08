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
        
        this.currentBGM = null;
        this.previousBGM = null; // フィーバータイム前のBGMを記録
        this.isPlaying = false;
        this.isFeverTime = false;
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
    startFeverTime() {
        if (this.isFeverTime) return; // 既にフィーバータイム中の場合は何もしない
        
        this.isFeverTime = true;
        this.previousBGM = this.currentBGM; // 現在のBGMを記録
        
        // フィーバーBGMを再生
        this.stopCurrentBGM();
        this.currentBGM = this.feverBGM;
        this.currentBGM.currentTime = 0;
        this.currentBGM.play().catch(error => {
            console.log('フィーバーBGM再生エラー:', error);
        });
        this.isPlaying = true;
    }

    // フィーバータイム終了
    endFeverTime() {
        if (!this.isFeverTime) return; // フィーバータイム中でない場合は何もしない
        
        this.isFeverTime = false;
        
        // 前のBGMに戻す
        this.stopCurrentBGM();
        if (this.previousBGM) {
            this.currentBGM = this.previousBGM;
            this.currentBGM.currentTime = 0;
            this.currentBGM.play().catch(error => {
                console.log('BGM復帰再生エラー:', error);
            });
            this.isPlaying = true;
            this.previousBGM = null;
        }
    }
}

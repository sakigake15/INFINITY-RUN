/**
 * 名前入力ダイアログ
 * プレイヤー名を入力してランキングに投稿するためのUI
 */
export class NameInputDialog {
    constructor() {
        this.dialog = null;
        this.nameInput = null;
        this.submitButton = null;
        this.cancelButton = null;
        this.errorMessage = null;
        this.isVisible = false;
        this.onSubmitCallback = null;
        this.onCancelCallback = null;
        
        this.createDialog();
    }

    /**
     * ダイアログのHTMLを作成
     */
    createDialog() {
        // ダイアログのHTML
        const dialogHTML = `
            <div id="name-input-overlay" class="name-input-overlay">
                <div class="name-input-dialog">
                    <div class="name-input-header">
                        <h3>ランキング登録</h3>
                        <p>5位以内の記録です！名前を入力してください</p>
                    </div>
                    
                    <div class="name-input-content">
                        <label for="player-name-input">プレイヤー名</label>
                        <input 
                            type="text" 
                            id="player-name-input" 
                            class="player-name-input"
                            placeholder="半角英数字 10文字以内"
                            maxlength="10"
                            autocomplete="off"
                        >
                        <div class="input-info">
                            <span class="char-count">0/10</span>
                            <span class="input-rules">半角英数字のみ</span>
                        </div>
                        <div id="name-error-message" class="error-message"></div>
                    </div>
                    
                    <div class="name-input-buttons">
                        <button id="name-submit-btn" class="submit-btn" disabled>投稿</button>
                        <button id="name-cancel-btn" class="cancel-btn">キャンセル</button>
                    </div>
                </div>
            </div>
        `;

        // DOMに追加
        document.body.insertAdjacentHTML('beforeend', dialogHTML);

        // 要素の参照を取得
        this.dialog = document.getElementById('name-input-overlay');
        this.nameInput = document.getElementById('player-name-input');
        this.submitButton = document.getElementById('name-submit-btn');
        this.cancelButton = document.getElementById('name-cancel-btn');
        this.errorMessage = document.getElementById('name-error-message');
        this.charCount = document.querySelector('.char-count');

        // 初期状態では非表示にする
        this.dialog.style.display = 'none';

        // イベントリスナーを設定
        this.setupEventListeners();

        // CSS スタイルを追加
        this.addStyles();
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // 名前入力フィールドの変更を監視
        this.nameInput.addEventListener('input', (e) => {
            this.handleNameInput(e.target.value);
        });

        // Enterキーで投稿
        this.nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.submitButton.disabled) {
                this.handleSubmit();
            } else if (e.key === 'Escape') {
                this.handleCancel();
            }
        });

        // 投稿ボタン
        this.submitButton.addEventListener('click', () => {
            this.handleSubmit();
        });

        // キャンセルボタン
        this.cancelButton.addEventListener('click', () => {
            this.handleCancel();
        });

        // オーバーレイクリックでキャンセル
        this.dialog.addEventListener('click', (e) => {
            if (e.target === this.dialog) {
                this.handleCancel();
            }
        });

        // ESCキーでキャンセル
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.handleCancel();
            }
        });
    }

    /**
     * 名前入力の処理
     * @param {string} value - 入力された値
     */
    handleNameInput(value) {
        // 文字数表示を更新
        this.charCount.textContent = `${value.length}/10`;

        // リアルタイムバリデーション
        const validation = this.validateName(value);
        
        if (value.length === 0) {
            // 空の場合はエラーを非表示
            this.showError('');
            this.submitButton.disabled = true;
        } else if (validation.isValid) {
            // 有効な場合
            this.showError('');
            this.submitButton.disabled = false;
        } else {
            // 無効な場合
            this.showError(validation.error);
            this.submitButton.disabled = true;
        }
    }

    /**
     * 名前のバリデーション
     * @param {string} name - プレイヤー名
     * @return {Object} バリデーション結果
     */
    validateName(name) {
        // 空文字チェック
        if (name.trim() === '') {
            return {
                isValid: false,
                error: '名前を入力してください'
            };
        }

        // 長さチェック（10文字以下）
        if (name.length > 10) {
            return {
                isValid: false,
                error: '名前は10文字以内で入力してください'
            };
        }

        // 半角英数字のみチェック
        const alphanumericPattern = /^[a-zA-Z0-9]+$/;
        if (!alphanumericPattern.test(name)) {
            return {
                isValid: false,
                error: '名前は半角英数字のみ使用できます'
            };
        }

        return {
            isValid: true,
            error: null
        };
    }

    /**
     * エラーメッセージを表示
     * @param {string} message - エラーメッセージ
     */
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = message ? 'block' : 'none';
    }

    /**
     * 投稿処理
     */
    handleSubmit() {
        const name = this.nameInput.value.trim();
        const validation = this.validateName(name);

        if (validation.isValid) {
            if (this.onSubmitCallback) {
                this.onSubmitCallback(name);
            }
        } else {
            this.showError(validation.error);
        }
    }

    /**
     * キャンセル処理
     */
    handleCancel() {
        if (this.onCancelCallback) {
            this.onCancelCallback();
        }
        this.hide();
    }

    /**
     * ダイアログを表示
     * @param {Function} onSubmit - 投稿時のコールバック
     * @param {Function} onCancel - キャンセル時のコールバック
     */
    show(onSubmit, onCancel) {
        this.onSubmitCallback = onSubmit;
        this.onCancelCallback = onCancel;
        
        // ダイアログを表示
        this.dialog.style.display = 'flex';
        this.isVisible = true;
        
        // 入力フィールドをリセット
        this.nameInput.value = '';
        this.nameInput.focus();
        this.handleNameInput('');
        
        // アニメーション
        setTimeout(() => {
            this.dialog.classList.add('show');
        }, 10);
    }

    /**
     * ダイアログを非表示
     */
    hide() {
        this.dialog.classList.remove('show');
        this.isVisible = false;
        
        setTimeout(() => {
            this.dialog.style.display = 'none';
            this.showError('');
        }, 300);
    }

    /**
     * ダイアログが表示中かどうか
     * @return {boolean}
     */
    isShowing() {
        return this.isVisible;
    }

    /**
     * スタイルを追加
     */
    addStyles() {
        if (document.getElementById('name-input-styles')) {
            return; // 既に追加済み
        }

        const style = document.createElement('style');
        style.id = 'name-input-styles';
        style.textContent = `
            .name-input-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .name-input-overlay.show {
                opacity: 1;
            }
            
            .name-input-dialog {
                background: #1a1a1a;
                border: 2px solid #00ffff;
                border-radius: 10px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 10px 30px rgba(0, 255, 255, 0.3);
                transform: scale(0.8);
                transition: transform 0.3s ease;
            }
            
            .name-input-overlay.show .name-input-dialog {
                transform: scale(1);
            }
            
            .name-input-header {
                text-align: center;
                margin-bottom: 25px;
            }
            
            .name-input-header h3 {
                color: #00ffff;
                font-size: 24px;
                margin: 0 0 10px 0;
                text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            }
            
            .name-input-header p {
                color: #ffffff;
                font-size: 16px;
                margin: 0;
                opacity: 0.9;
            }
            
            .name-input-content {
                margin-bottom: 25px;
            }
            
            .name-input-content label {
                display: block;
                color: #ffffff;
                font-size: 16px;
                margin-bottom: 10px;
                font-weight: bold;
            }
            
            .player-name-input {
                width: 100%;
                padding: 12px 15px;
                font-size: 18px;
                background: #2a2a2a;
                border: 2px solid #444;
                border-radius: 5px;
                color: #ffffff;
                outline: none;
                transition: border-color 0.3s ease, box-shadow 0.3s ease;
                box-sizing: border-box;
            }
            
            .player-name-input:focus {
                border-color: #00ffff;
                box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
            }
            
            .input-info {
                display: flex;
                justify-content: space-between;
                margin-top: 8px;
                font-size: 12px;
                color: #aaaaaa;
            }
            
            .char-count {
                font-weight: bold;
            }
            
            .error-message {
                display: none;
                color: #ff4444;
                font-size: 14px;
                margin-top: 8px;
                padding: 8px;
                background: rgba(255, 68, 68, 0.1);
                border: 1px solid rgba(255, 68, 68, 0.3);
                border-radius: 4px;
            }
            
            .name-input-buttons {
                display: flex;
                gap: 15px;
                justify-content: center;
            }
            
            .name-input-buttons button {
                padding: 12px 30px;
                font-size: 16px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-weight: bold;
                min-width: 100px;
            }
            
            .submit-btn {
                background: #00ffff;
                color: #000000;
                box-shadow: 0 4px 15px rgba(0, 255, 255, 0.3);
            }
            
            .submit-btn:hover:not(:disabled) {
                background: #00cccc;
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 255, 255, 0.4);
            }
            
            .submit-btn:disabled {
                background: #555;
                color: #888;
                cursor: not-allowed;
                box-shadow: none;
            }
            
            .cancel-btn {
                background: transparent;
                color: #ffffff;
                border: 2px solid #666;
            }
            
            .cancel-btn:hover {
                background: #666;
                transform: translateY(-2px);
            }
            
            @media (max-width: 500px) {
                .name-input-dialog {
                    padding: 20px;
                    margin: 20px;
                }
                
                .name-input-buttons {
                    flex-direction: column;
                }
                
                .name-input-buttons button {
                    width: 100%;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * ダイアログを破棄
     */
    destroy() {
        if (this.dialog) {
            this.dialog.remove();
        }
        
        const styles = document.getElementById('name-input-styles');
        if (styles) {
            styles.remove();
        }
    }
}

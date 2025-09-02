/**
 * ゲーム連携例 - ランキングシステム
 * 3Dゲーム側での実装例
 */

// ランキングシステムのWeb App URL（実際のURLに変更してください）
const RANKING_API_URL = 'YOUR_WEB_APP_URL_HERE';

/**
 * ランキングシステムクラス
 */
class RankingSystem {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.isSubmitting = false;
  }

  /**
   * スコアをランキングに送信
   * @param {number} score - プレイヤーのスコア
   * @param {string} playerName - プレイヤー名
   * @return {Promise<Object|null>} - 送信結果
   */
  async submitScore(score, playerName) {
    if (this.isSubmitting) {
      console.warn('既にスコア送信中です');
      return null;
    }

    this.isSubmitting = true;

    try {
      // 入力値の事前チェック
      const validation = this.validateInput(score, playerName);
      if (!validation.isValid) {
        console.error('入力エラー:', validation.error);
        return {
          success: false,
          error: validation.error
        };
      }

      console.log(`スコア送信開始: ${score} (${playerName})`);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: parseInt(score),
          name: playerName.toLowerCase().trim()
        }),
        // タイムアウト設定
        signal: AbortSignal.timeout(10000) // 10秒でタイムアウト
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log(`ランキング登録成功: ${result.rank}位`);
      } else {
        console.error(`ランキング登録失敗: ${result.error}`);
      }

      return result;

    } catch (error) {
      console.error('スコア送信エラー:', error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: '通信がタイムアウトしました'
        };
      } else if (error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'ネットワークエラーが発生しました'
        };
      } else {
        return {
          success: false,
          error: '通信エラーが発生しました'
        };
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * 入力値の事前検証（クライアント側）
   * @param {any} score - スコア
   * @param {any} name - 名前
   * @return {Object} - 検証結果
   */
  validateInput(score, name) {
    // スコア検証
    if (score === null || score === undefined) {
      return { isValid: false, error: 'スコアが指定されていません' };
    }

    const numScore = Number(score);
    if (isNaN(numScore) || !Number.isInteger(numScore) || numScore <= 0) {
      return { isValid: false, error: 'スコアは正の整数である必要があります' };
    }

    // 名前検証
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: '名前を入力してください' };
    }

    const trimmedName = name.trim().toLowerCase();
    if (trimmedName === '') {
      return { isValid: false, error: '名前を入力してください' };
    }

    if (!/^[a-z]+$/.test(trimmedName)) {
      return { isValid: false, error: '名前は小文字のアルファベットのみ使用できます' };
    }

    if (trimmedName.length > 50) {
      return { isValid: false, error: '名前は50文字以内で入力してください' };
    }

    return { isValid: true, error: null };
  }

  /**
   * 送信状態を取得
   * @return {boolean} - 送信中かどうか
   */
  isSubmittingScore() {
    return this.isSubmitting;
  }
}

/**
 * ゲーム終了時のランキング処理例
 */
class GameEndHandler {
  constructor(rankingSystem) {
    this.rankingSystem = rankingSystem;
    this.playerNameInput = null;
    this.submitButton = null;
    this.messageDiv = null;
  }

  /**
   * ゲーム終了時の処理
   * @param {number} finalScore - 最終スコア
   */
  async handleGameEnd(finalScore) {
    console.log(`ゲーム終了: スコア ${finalScore}`);

    // 高スコア達成の判定（例：1000点以上）
    if (finalScore >= 1000) {
      this.showNameInputDialog(finalScore);
    } else {
      this.showScoreResult(finalScore, false);
    }
  }

  /**
   * 名前入力ダイアログを表示
   * @param {number} score - スコア
   */
  showNameInputDialog(score) {
    // HTMLの作成（実際のゲームUIに合わせて調整）
    const dialog = document.createElement('div');
    dialog.className = 'ranking-dialog';
    dialog.innerHTML = `
      <div class="dialog-content">
        <h2>高スコア達成！</h2>
        <p>スコア: ${score}</p>
        <p>ランキングに登録しますか？</p>
        <input type="text" id="playerNameInput" placeholder="名前を入力（小文字英字のみ）" maxlength="50">
        <div class="dialog-buttons">
          <button id="submitRanking">登録</button>
          <button id="cancelRanking">キャンセル</button>
        </div>
        <div id="rankingMessage"></div>
      </div>
    `;

    document.body.appendChild(dialog);

    // 要素の参照を取得
    this.playerNameInput = document.getElementById('playerNameInput');
    this.submitButton = document.getElementById('submitRanking');
    this.messageDiv = document.getElementById('rankingMessage');

    // イベントリスナーの設定
    this.setupDialogEvents(score, dialog);
  }

  /**
   * ダイアログのイベント設定
   * @param {number} score - スコア
   * @param {HTMLElement} dialog - ダイアログ要素
   */
  setupDialogEvents(score, dialog) {
    // 登録ボタン
    this.submitButton.addEventListener('click', async () => {
      await this.handleSubmit(score);
    });

    // キャンセルボタン
    document.getElementById('cancelRanking').addEventListener('click', () => {
      this.closeDialog(dialog);
    });

    // Enterキーで送信
    this.playerNameInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        await this.handleSubmit(score);
      }
    });

    // 入力値のリアルタイム検証
    this.playerNameInput.addEventListener('input', (e) => {
      this.validateNameInput(e.target.value);
    });

    // フォーカスを名前入力に設定
    this.playerNameInput.focus();
  }

  /**
   * 送信処理
   * @param {number} score - スコア
   */
  async handleSubmit(score) {
    const playerName = this.playerNameInput.value.trim();

    // ボタンを無効化
    this.submitButton.disabled = true;
    this.submitButton.textContent = '送信中...';

    try {
      const result = await this.rankingSystem.submitScore(score, playerName);

      if (result && result.success) {
        this.showSuccess(result.rank);
      } else {
        this.showError(result ? result.error : '通信エラーが発生しました');
      }
    } catch (error) {
      this.showError('予期しないエラーが発生しました');
    } finally {
      this.submitButton.disabled = false;
      this.submitButton.textContent = '登録';
    }
  }

  /**
   * 名前入力のリアルタイム検証
   * @param {string} name - 入力された名前
   */
  validateNameInput(name) {
    const validation = this.rankingSystem.validateInput(1, name);
    
    if (!validation.isValid && name.length > 0) {
      this.playerNameInput.style.borderColor = '#ff4444';
      this.showMessage(validation.error, 'error');
    } else {
      this.playerNameInput.style.borderColor = '#44ff44';
      this.showMessage('', '');
    }
  }

  /**
   * 成功メッセージを表示
   * @param {number} rank - ランキング順位
   */
  showSuccess(rank) {
    this.showMessage(`おめでとうございます！${rank}位にランクインしました！`, 'success');
    
    // 3秒後にダイアログを閉じる
    setTimeout(() => {
      this.closeDialog(document.querySelector('.ranking-dialog'));
    }, 3000);
  }

  /**
   * エラーメッセージを表示
   * @param {string} error - エラーメッセージ
   */
  showError(error) {
    this.showMessage(error, 'error');
  }

  /**
   * メッセージを表示
   * @param {string} message - メッセージ
   * @param {string} type - メッセージタイプ（success, error, info）
   */
  showMessage(message, type) {
    if (this.messageDiv) {
      this.messageDiv.textContent = message;
      this.messageDiv.className = `message ${type}`;
    }
  }

  /**
   * スコア結果を表示（ランキング対象外）
   * @param {number} score - スコア
   * @param {boolean} isHighScore - 高スコアかどうか
   */
  showScoreResult(score, isHighScore) {
    const message = isHighScore 
      ? `素晴らしいスコアです！ ${score}点`
      : `お疲れ様でした！ スコア: ${score}点`;
    
    console.log(message);
    // 実際のゲームUIでスコア表示処理を実装
  }

  /**
   * ダイアログを閉じる
   * @param {HTMLElement} dialog - ダイアログ要素
   */
  closeDialog(dialog) {
    if (dialog && dialog.parentNode) {
      dialog.parentNode.removeChild(dialog);
    }
  }
}

// 使用例
document.addEventListener('DOMContentLoaded', () => {
  // ランキングシステムの初期化
  const rankingSystem = new RankingSystem(RANKING_API_URL);
  const gameEndHandler = new GameEndHandler(rankingSystem);

  // ゲーム終了時の処理例
  window.onGameEnd = function(finalScore) {
    gameEndHandler.handleGameEnd(finalScore);
  };

  // テスト用関数（デバッグ時に使用）
  window.testRanking = async function(score = 1500, name = 'testplayer') {
    console.log('ランキングテスト開始');
    const result = await rankingSystem.submitScore(score, name);
    console.log('テスト結果:', result);
    return result;
  };
});

// CSSスタイル例（実際のゲームに合わせて調整）
const rankingDialogCSS = `
.ranking-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.dialog-content h2 {
  color: #333;
  margin-bottom: 10px;
}

.dialog-content input {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 2px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
}

.dialog-buttons {
  margin-top: 15px;
}

.dialog-buttons button {
  padding: 10px 20px;
  margin: 0 5px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.dialog-buttons button:first-child {
  background: #4CAF50;
  color: white;
}

.dialog-buttons button:last-child {
  background: #f44336;
  color: white;
}

.dialog-buttons button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.message {
  margin-top: 10px;
  padding: 5px;
  border-radius: 3px;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
`;

// CSSを動的に追加
const style = document.createElement('style');
style.textContent = rankingDialogCSS;
document.head.appendChild(style);

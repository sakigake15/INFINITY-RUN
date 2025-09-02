/**
 * ランキングシステム - データ検証機能
 * Google Apps Script用
 */

/**
 * 入力データの検証
 * @param {any} score - スコア
 * @param {any} name - 名前
 * @return {Object} - 検証結果
 */
function validateInput(score, name) {
  // スコアの検証
  const scoreValidation = validateScore(score);
  if (!scoreValidation.isValid) {
    return scoreValidation;
  }
  
  // 名前の検証
  const nameValidation = validateName(name);
  if (!nameValidation.isValid) {
    return nameValidation;
  }
  
  return {
    isValid: true,
    error: null
  };
}

/**
 * スコアの検証
 * @param {any} score - スコア
 * @return {Object} - 検証結果
 */
function validateScore(score) {
  // null, undefinedチェック
  if (score === null || score === undefined) {
    return {
      isValid: false,
      error: 'スコアが指定されていません'
    };
  }
  
  // 数値チェック
  if (typeof score !== 'number' && isNaN(Number(score))) {
    return {
      isValid: false,
      error: 'スコアは数値である必要があります'
    };
  }
  
  const numScore = Number(score);
  
  // 整数チェック
  if (!Number.isInteger(numScore)) {
    return {
      isValid: false,
      error: 'スコアは整数である必要があります'
    };
  }
  
  // 正の数チェック
  if (numScore <= 0) {
    return {
      isValid: false,
      error: 'スコアは正の整数である必要があります'
    };
  }
  
  // 最大値チェック（オーバーフロー防止）
  if (numScore > Number.MAX_SAFE_INTEGER) {
    return {
      isValid: false,
      error: 'スコアが大きすぎます'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
}

/**
 * 名前の検証
 * @param {any} name - 名前
 * @return {Object} - 検証結果
 */
function validateName(name) {
  // null, undefinedチェック
  if (name === null || name === undefined) {
    return {
      isValid: false,
      error: '名前が指定されていません'
    };
  }
  
  // 文字列チェック
  if (typeof name !== 'string') {
    return {
      isValid: false,
      error: '名前は文字列である必要があります'
    };
  }
  
  // 空文字チェック
  if (name.trim() === '') {
    return {
      isValid: false,
      error: '名前を入力してください'
    };
  }
  
  // 長さチェック
  if (name.length > 50) {
    return {
      isValid: false,
      error: '名前は50文字以内で入力してください'
    };
  }
  
  // 半角英数字のみチェック（10文字以下）
  if (name.length > 10) {
    return {
      isValid: false,
      error: '名前は10文字以内で入力してください'
    };
  }
  
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
 * スプレッドシートIDの検証
 * @param {string} spreadsheetId - スプレッドシートID
 * @return {Object} - 検証結果
 */
function validateSpreadsheetId(spreadsheetId) {
  if (!spreadsheetId || spreadsheetId === 'YOUR_SPREADSHEET_ID_HERE') {
    return {
      isValid: false,
      error: 'スプレッドシートIDが設定されていません'
    };
  }
  
  try {
    // スプレッドシートにアクセス可能かテスト
    SpreadsheetApp.openById(spreadsheetId);
    return {
      isValid: true,
      error: null
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'スプレッドシートにアクセスできません: ' + error.message
    };
  }
}

/**
 * テスト用関数 - 検証機能のテスト
 */
function testValidation() {
  console.log('=== データ検証テスト開始 ===');
  
  // スコア検証テスト
  console.log('--- スコア検証テスト ---');
  console.log('正常値(100):', validateScore(100));
  console.log('文字列("abc"):', validateScore("abc"));
  console.log('負の数(-10):', validateScore(-10));
  console.log('小数(10.5):', validateScore(10.5));
  console.log('null:', validateScore(null));
  
  // 名前検証テスト
  console.log('--- 名前検証テスト ---');
  console.log('正常値("player"):', validateName("player"));
  console.log('大文字("Player"):', validateName("Player"));
  console.log('数字("player1"):', validateName("player1"));
  console.log('空文字(""):', validateName(""));
  console.log('null:', validateName(null));
  
  // 総合検証テスト
  console.log('--- 総合検証テスト ---');
  console.log('正常値(100, "player"):', validateInput(100, "player"));
  console.log('異常値("abc", "Player1"):', validateInput("abc", "Player1"));
  
  console.log('=== データ検証テスト終了 ===');
}

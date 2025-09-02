/**
 * ランキングシステム - セットアップ機能
 * Google Apps Script用
 */

/**
 * 初期データをスプレッドシートに設定
 * このファンクションを手動で実行してスプレッドシートを初期化します
 */
function initializeSpreadsheet() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    
    // シートをクリア
    sheet.clear();
    
    // ヘッダー行を設定（必須ではないが、分かりやすくするため）
    sheet.getRange(1, 1, 1, 3).setValues([['スコア', '名前', '日付']]);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
    
    // 初期データを追加
    const initialData = [
      [1000, 'alice', new Date('2024-01-01')],
      [900, 'bob', new Date('2024-01-02')],
      [800, 'charlie', new Date('2024-01-03')],
      [700, 'david', new Date('2024-01-04')],
      [600, 'eve', new Date('2024-01-05')]
    ];
    
    // 初期データを追加（2行目から開始）
    sheet.getRange(2, 1, initialData.length, 3).setValues(initialData);
    
    // 列の幅を調整
    sheet.setColumnWidth(1, 80);  // スコア列
    sheet.setColumnWidth(2, 100); // 名前列
    sheet.setColumnWidth(3, 150); // 日付列
    
    // データの書式設定
    sheet.getRange(2, 1, initialData.length + 10, 1).setNumberFormat('0'); // スコア列を整数形式
    sheet.getRange(2, 3, initialData.length + 10, 1).setNumberFormat('yyyy/mm/dd hh:mm:ss'); // 日付列
    
    console.log('スプレッドシートの初期化が完了しました');
    return {
      success: true,
      message: 'スプレッドシートの初期化が完了しました'
    };
    
  } catch (error) {
    console.error('スプレッドシート初期化エラー:', error);
    return {
      success: false,
      error: 'スプレッドシートの初期化に失敗しました: ' + error.message
    };
  }
}

/**
 * スプレッドシートの設定確認
 * @return {Object} - 確認結果
 */
function checkSpreadsheetSetup() {
  try {
    // スプレッドシートIDの検証
    const validation = validateSpreadsheetId(SPREADSHEET_ID);
    if (!validation.isValid) {
      return validation;
    }
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    console.log('現在のデータ行数:', data.length);
    console.log('現在のデータ:', data);
    
    return {
      success: true,
      message: 'スプレッドシートの設定は正常です',
      dataCount: data.length,
      data: data
    };
    
  } catch (error) {
    console.error('設定確認エラー:', error);
    return {
      success: false,
      error: '設定確認に失敗しました: ' + error.message
    };
  }
}

/**
 * テストデータの追加
 */
function addTestData() {
  try {
    const testData = [
      [1500, 'testuser', new Date()],
      [750, 'newplayer', new Date()],
      [550, 'rookie', new Date()]
    ];
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    
    testData.forEach(row => {
      sheet.appendRow(row);
    });
    
    // ソート実行
    const range = sheet.getDataRange();
    range.sort([
      {column: 1, ascending: false}, // A列（スコア）で降順
      {column: 3, ascending: false}  // C列（日付）で降順
    ]);
    
    console.log('テストデータが追加されました');
    return {
      success: true,
      message: 'テストデータが追加されました'
    };
    
  } catch (error) {
    console.error('テストデータ追加エラー:', error);
    return {
      success: false,
      error: 'テストデータの追加に失敗しました: ' + error.message
    };
  }
}

/**
 * Web Appのデプロイ用設定確認
 */
function checkWebAppSettings() {
  console.log('=== Web App デプロイ設定確認 ===');
  console.log('1. プロジェクトを保存してください');
  console.log('2. 「デプロイ」→「新しいデプロイ」を選択');
  console.log('3. 種類で「ウェブアプリ」を選択');
  console.log('4. 実行者: 「自分」を選択');
  console.log('5. アクセスできるユーザー: 「全員」を選択');
  console.log('6. デプロイボタンをクリック');
  console.log('7. 権限の承認を行う');
  console.log('8. デプロイ後に表示されるウェブアプリのURLをメモ');
  console.log('================================');
  
  return {
    success: true,
    message: 'Web App デプロイ手順を確認してください'
  };
}

/**
 * APIテスト用のHTTPリクエスト例を表示
 */
function showAPITestExamples() {
  console.log('=== API テスト例 ===');
  console.log('1. 成功例:');
  console.log('curl -X POST [YOUR_WEB_APP_URL] \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"score": 1200, "name": "testplayer"}\'');
  console.log('');
  console.log('2. エラー例（無効なスコア）:');
  console.log('curl -X POST [YOUR_WEB_APP_URL] \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"score": "abc", "name": "testplayer"}\'');
  console.log('');
  console.log('3. エラー例（無効な名前）:');
  console.log('curl -X POST [YOUR_WEB_APP_URL] \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"score": 1000, "name": "TestPlayer123"}\'');
  console.log('==================');
  
  return {
    success: true,
    message: 'API テスト例を確認してください'
  };
}

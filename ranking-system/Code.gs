/**
 * ランキングシステム - メイン処理
 * Google Apps Script用
 */

// スプレッドシートのIDを設定（実際のスプレッドシートIDに変更してください）
const SPREADSHEET_ID = '1rkOfDyIr5YIljYlWzSr8z9oPIx3o3PvfytlHJX407S8';

/**
 * Web Appのメインエントリポイント（GET）
 * @param {Object} e - リクエストオブジェクト
 * @return {ContentService} - JSON レスポンス
 */
function doGet(e) {
  try {
    // JSONPコールバックパラメータをチェック
    const callback = e.parameter.callback;
    
    // POSTアクション（JSONP経由）をチェック
    const action = e.parameter.action;
    
    if (action === 'post') {
      // JSONP形式でのスコア投稿処理
      const score = parseInt(e.parameter.score, 10);
      const name = e.parameter.name;
      
      console.log('JSONP形式でのスコア投稿:', { score, name });
      
      // データ検証
      const validation = validateInput(score, name);
      if (!validation.isValid) {
        return createErrorResponse(validation.error, callback);
      }
      
      // ランキング処理
      const result = processRanking(score, name);
      
      if (result.success) {
        return createSuccessResponse(result.message, result.rank, callback);
      } else {
        return createErrorResponse(result.error, callback);
      }
    } else {
      // 通常のランキング取得処理
      const rankingData = getRankingData();
      
      if (rankingData.length > 0) {
        return createRankingResponse(rankingData, callback);
      } else {
        return createErrorResponse('ランキングデータが見つかりません', callback);
      }
    }
    
  } catch (error) {
    console.error('リクエスト処理エラー:', error);
    return createErrorResponse('リクエスト処理中にエラーが発生しました', e.parameter.callback);
  }
}

/**
 * Web Appのメインエントリポイント（POST）
 * @param {Object} e - リクエストオブジェクト
 * @return {ContentService} - JSON レスポンス
 */
function doPost(e) {
  try {
    // リクエストデータの解析
    const requestData = JSON.parse(e.postData.contents);
    const { score, name } = requestData;
    
    // データ検証
    const validation = validateInput(score, name);
    if (!validation.isValid) {
      return createErrorResponse(validation.error);
    }
    
    // ランキング処理
    const result = processRanking(score, name);
    
    if (result.success) {
      return createSuccessResponse(result.message, result.rank);
    } else {
      return createErrorResponse(result.error);
    }
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    return createErrorResponse('サーバーエラーが発生しました');
  }
}

/**
 * ランキング処理のメイン関数
 * @param {number} score - スコア
 * @param {string} name - 名前
 * @return {Object} - 処理結果
 */
function processRanking(score, name) {
  try {
    // スプレッドシートIDが設定されていない場合はテスト投稿として処理
    if (SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
      console.log('テスト環境でのスコア投稿:', { score, name });
      
      // テストデータと比較して順位を判定
      const testData = getTestRankingData();
      let newRank = 1;
      
      for (let i = 0; i < testData.length; i++) {
        if (score >= testData[i].score) {
          newRank = i + 1;
          break;
        }
      }
      
      // 5位以内の場合は成功として返す
      if (newRank <= 5) {
        return {
          success: true,
          message: 'テスト環境でランキングに登録されました',
          rank: newRank
        };
      } else {
        return {
          success: false,
          error: 'スコアが5位のスコア以下のため、ランキングに登録されませんでした'
        };
      }
    }
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    
    // 現在のデータを取得
    const data = sheet.getDataRange().getValues();
    
    // 5位のスコアを取得（データが5件未満の場合は0とする）
    let fifthScore = 0;
    if (data.length >= 5) {
      fifthScore = data[4][0]; // A列（スコア）の5行目
    }
    
    // スコアが5位以下の場合は何もしない
    if (score <= fifthScore && data.length >= 5) {
      return {
        success: false,
        error: 'スコアが5位のスコア以下のため、ランキングに登録されませんでした'
      };
    }
    
    // 新しいデータを追加
    const currentDate = new Date();
    const newRow = [score, name, currentDate];
    
    // データの最後に追加
    sheet.appendRow(newRow);
    
    // スコアで降順ソート（同スコアの場合は日付の遅い順）
    const range = sheet.getDataRange();
    range.sort([
      {column: 1, ascending: false}, // A列（スコア）で降順
      {column: 3, ascending: false}  // C列（日付）で降順
    ]);
    
    // 新しい順位を取得
    const sortedData = sheet.getDataRange().getValues();
    let newRank = 1;
    for (let i = 0; i < sortedData.length; i++) {
      if (sortedData[i][0] === score && sortedData[i][1] === name) {
        // 同じスコア・名前の中で最も遅い日付のものを探す
        let latestDate = sortedData[i][2];
        let latestIndex = i;
        
        for (let j = i + 1; j < sortedData.length; j++) {
          if (sortedData[j][0] === score && sortedData[j][1] === name) {
            if (sortedData[j][2] > latestDate) {
              latestDate = sortedData[j][2];
              latestIndex = j;
            }
          } else {
            break;
          }
        }
        
        if (latestIndex === i) {
          newRank = i + 1;
          break;
        }
      }
    }
    
    return {
      success: true,
      message: 'ランキングに登録されました',
      rank: newRank
    };
    
  } catch (error) {
    console.error('ランキング処理エラー:', error);
    return {
      success: false,
      error: 'ランキング処理中にエラーが発生しました'
    };
  }
}

/**
 * 成功レスポンスを作成
 * @param {string} message - メッセージ
 * @param {number} rank - 順位
 * @param {string} callback - JSONPコールバック関数名
 * @return {ContentService} - JSONレスポンス
 */
function createSuccessResponse(message, rank, callback) {
  const response = {
    success: true,
    message: message,
    rank: rank
  };
  
  let output = JSON.stringify(response);
  let mimeType = ContentService.MimeType.JSON;
  
  // JSONPコールバックが指定されている場合
  if (callback) {
    output = callback + '(' + output + ');';
    mimeType = ContentService.MimeType.JAVASCRIPT;
  }
  
  return ContentService
    .createTextOutput(output)
    .setMimeType(mimeType);
}

/**
 * ランキングレスポンスを作成
 * @param {Array} rankingData - ランキングデータ
 * @param {string} callback - JSONPコールバック関数名
 * @return {ContentService} - JSONレスポンス
 */
function createRankingResponse(rankingData, callback) {
  // top5形式でレスポンスを作成（既存のAPIとの互換性を保つ）
  const response = {
    top5: rankingData.map(item => ({
      score: item.score,
      name: item.name,
      date: item.date instanceof Date ? item.date.toISOString() : item.date
    }))
  };
  
  let output = JSON.stringify(response);
  let mimeType = ContentService.MimeType.JSON;
  
  // JSONPコールバックが指定されている場合
  if (callback) {
    output = callback + '(' + output + ');';
    mimeType = ContentService.MimeType.JAVASCRIPT;
  }
  
  return ContentService
    .createTextOutput(output)
    .setMimeType(mimeType);
}

/**
 * エラーレスポンスを作成
 * @param {string} error - エラーメッセージ
 * @param {string} callback - JSONPコールバック関数名
 * @return {ContentService} - JSONレスポンス
 */
function createErrorResponse(error, callback) {
  const response = {
    success: false,
    error: error,
    top5: [] // エラー時も空の配列を返す
  };
  
  let output = JSON.stringify(response);
  let mimeType = ContentService.MimeType.JSON;
  
  // JSONPコールバックが指定されている場合
  if (callback) {
    output = callback + '(' + output + ');';
    mimeType = ContentService.MimeType.JAVASCRIPT;
  }
  
  return ContentService
    .createTextOutput(output)
    .setMimeType(mimeType);
}

/**
 * 日付を文字列にフォーマット
 * @param {Date} date - 日付オブジェクト
 * @return {string} - フォーマットされた日付文字列
 */
function formatDate(date) {
  if (!date || !(date instanceof Date)) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * ランキングデータを取得
 * @return {Array} - ランキングデータ
 */
function getRankingData() {
  try {
    // スプレッドシートIDが設定されていない場合はエラー
    if (SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
      throw new Error('スプレッドシートIDが設定されていません');
    }
    
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // データが存在しない場合は空配列を返す
    if (!data || data.length === 0) {
      return [];
    }
    
    // 上位5件のみ返す
    return data.slice(0, 5).map((row, index) => ({
      rank: index + 1,
      score: row[0],
      name: row[1],
      date: row[2]
    }));
    
  } catch (error) {
    console.error('ランキングデータ取得エラー:', error);
    // エラー時は空配列を返す
    return [];
  }
}

/**
 * テスト用ランキングデータを取得
 * @return {Array} - テスト用ランキングデータ
 */
function getTestRankingData() {
  return [
    {
      rank: 1,
      score: 1505,
      name: 'goro',
      date: new Date('2025-08-26T11:18:33.057Z')
    },
    {
      rank: 2,
      score: 1200,
      name: 'newplayer',
      date: new Date('2025-09-02T10:25:48.769Z')
    },
    {
      rank: 3,
      score: 1000,
      name: 'alice',
      date: new Date('2024-01-01T00:00:00.000Z')
    },
    {
      rank: 4,
      score: 900,
      name: 'bob',
      date: new Date('2024-01-02T00:00:00.000Z')
    },
    {
      rank: 5,
      score: 890,
      name: 'takashi',
      date: new Date('2025-08-26T11:27:45.749Z')
    }
  ];
}

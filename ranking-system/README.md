# ランキングシステム - Google Apps Script

3Dゲーム用のランキングシステムです。Google Apps ScriptとGoogleスプレッドシートを使用して、ハイスコアランキングを管理します。

## 機能

- **スコア登録**: 5位より高いスコアの場合のみランキングに登録
- **データ検証**: スコア（正の整数）と名前（小文字アルファベット）の厳密な検証
- **自動ソート**: スコア降順、同スコアの場合は日付の遅い順でソート
- **Web API**: JSON形式でのHTTPリクエスト/レスポンス
- **エラーハンドリング**: 詳細なエラーメッセージとバリデーション

## ファイル構成

```
ranking-system/
├── Code.gs          # メイン処理（Web API、ランキング登録）
├── Validation.gs    # データ検証機能
├── Setup.gs         # セットアップとテスト機能
└── README.md        # このファイル
```

## セットアップ手順

### 1. Googleスプレッドシートの作成

1. [Google Sheets](https://sheets.google.com)にアクセス
2. 新しいスプレッドシートを作成
3. スプレッドシートのURLからIDを取得
   - URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - `SPREADSHEET_ID`の部分をコピー

### 2. Google Apps Scriptプロジェクトの作成

1. [Google Apps Script](https://script.google.com)にアクセス
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を「ランキングシステム」に変更

### 3. コードの追加

1. `Code.gs`、`Validation.gs`、`Setup.gs`の各ファイルをGoogle Apps Scriptエディタに追加
2. `Code.gs`の`SPREADSHEET_ID`を実際のスプレッドシートIDに変更

```javascript
const SPREADSHEET_ID = '実際のスプレッドシートIDをここに入力';
```

### 4. 初期データの設定

1. Google Apps Scriptエディタで`Setup.gs`を開く
2. `initializeSpreadsheet`関数を実行
3. 権限の承認画面が表示されたら「許可」をクリック

### 5. Web Appのデプロイ

1. 「デプロイ」→「新しいデプロイ」を選択
2. 種類で「ウェブアプリ」を選択
3. 設定:
   - **実行者**: 自分
   - **アクセスできるユーザー**: 全員
4. 「デプロイ」をクリック
5. 表示されるWeb AppのURLをメモ

## API仕様

### エンドポイント

#### スコア登録（POST）
```
POST [YOUR_WEB_APP_URL]
Content-Type: application/json
```

#### ランキング取得（GET）
```
GET [YOUR_WEB_APP_URL]
```

### リクエスト形式

#### スコア登録
```json
{
  "score": 1000,
  "name": "player"
}
```

#### ランキング取得
```
リクエストボディなし
```

### レスポンス形式

#### スコア登録成功時
```json
{
  "success": true,
  "message": "ランキングに登録されました",
  "rank": 3
}
```

#### ランキング取得成功時
```json
{
  "success": true,
  "ranking": [
    {"rank": 1, "score": 1500, "name": "alice", "date": "2024-08-26 10:30:15"},
    {"rank": 2, "score": 1200, "name": "bob", "date": "2024-08-25 15:20:10"},
    {"rank": 3, "score": 1000, "name": "charlie", "date": "2024-08-24 09:45:30"},
    {"rank": 4, "score": 900, "name": "david", "date": "2024-08-23 18:15:22"},
    {"rank": 5, "score": 800, "name": "eve", "date": "2024-08-22 12:30:45"}
  ]
}
```

#### エラー時
```json
{
  "success": false,
  "error": "スコアは正の整数である必要があります"
}
```

### エラーメッセージ一覧

#### スコア関連
- `スコアが指定されていません`
- `スコアは数値である必要があります`
- `スコアは整数である必要があります`
- `スコアは正の整数である必要があります`
- `スコアが大きすぎます`

#### 名前関連
- `名前が指定されていません`
- `名前は文字列である必要があります`
- `名前を入力してください`
- `名前は50文字以内で入力してください`
- `名前は小文字のアルファベットのみ使用できます`

#### その他
- `スコアが5位のスコア以下のため、ランキングに登録されませんでした`
- `サーバーエラーが発生しました`

## テスト方法

### 1. 基本テスト（Google Apps Script内）

```javascript
// データ検証テスト
testValidation();

// スプレッドシート設定確認
checkSpreadsheetSetup();

// テストデータ追加
addTestData();
```

### 2. Web API テスト（外部）

#### cURLを使用したテスト

##### スコア登録テスト
```bash
# 成功例
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{"score": 1200, "name": "testplayer"}'

# エラー例（無効なスコア）
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{"score": "abc", "name": "testplayer"}'

# エラー例（無効な名前）
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{"score": 1000, "name": "TestPlayer123"}'
```

##### ランキング取得テスト
```bash
# ランキング取得
curl -X GET "YOUR_WEB_APP_URL"

# または（GETはデフォルトなので省略可能）
curl "YOUR_WEB_APP_URL"
```

#### JavaScript（ゲーム側）での実装例

```javascript
async function submitScore(score, playerName) {
  try {
    const response = await fetch('YOUR_WEB_APP_URL', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        score: score,
        name: playerName
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`ランキング登録成功: ${result.rank}位`);
      return result;
    } else {
      console.error(`ランキング登録失敗: ${result.error}`);
      return null;
    }
  } catch (error) {
    console.error('通信エラー:', error);
    return null;
  }
}

// 使用例
submitScore(1500, 'player').then(result => {
  if (result) {
    alert(`おめでとうございます！${result.rank}位にランクインしました！`);
  }
});
```

## スプレッドシート構成

| 列 | 内容 | 形式 | 説明 |
|---|---|---|---|
| A | スコア | 正の整数 | プレイヤーのスコア |
| B | 名前 | 小文字アルファベット | プレイヤー名 |
| C | 日付 | YYYY/MM/DD HH:MM:SS | 登録日時（自動設定） |

## 注意事項

1. **スプレッドシートID**: `Code.gs`内の`SPREADSHEET_ID`を必ず実際のIDに変更してください
2. **権限設定**: Web Appのアクセス権限は「全員」に設定する必要があります
3. **データ制限**: 名前は50文字以内、スコアは正の整数のみ
4. **ランキング上限**: 常に上位データのみ保持（5位以下のスコアは登録されません）
5. **重複データ**: 同じ名前・スコアでも複数回登録可能（日付で区別）

## トラブルシューティング

### よくある問題

1. **スプレッドシートにアクセスできません**
   - スプレッドシートIDが正しいか確認
   - スプレッドシートの共有設定を確認

2. **Web Appにアクセスできません**
   - デプロイ設定で「アクセスできるユーザー」が「全員」になっているか確認
   - URLが正しいか確認

3. **権限エラー**
   - Google Apps Scriptでの権限承認を実行
   - スプレッドシートへのアクセス権限を確認

### デバッグ方法

1. Google Apps Scriptエディタでログを確認
2. `checkSpreadsheetSetup()`でデータ状態を確認
3. `testValidation()`でバリデーション機能をテスト

## 更新履歴

- **v1.0.0** (2024/08/26): 初回リリース
  - 基本的なランキング機能
  - データ検証機能
  - Web API機能
  - セットアップ支援機能

https://script.google.com/macros/s/AKfycbwPUbNDW37sVmMWQE5xUFJuhQksg1U6EGyBZXDHvSO1qAihAfvsia6uePJRjPZmhD0T/exec

https://script.google.com/macros/s/AKfycbw_cPEy79WZ6ypWKESFbSyBKWkq8wWlBDSSvgJ_vn2_8FJ_7rvRvozKQHzXBeCupFAd/exec

curl -X POST "https://script.google.com/macros/s/AKfycbwPUbNDW37sVmMWQE5xUFJuhQksg1U6EGyBZXDHvSO1qAihAfvsia6uePJRjPZmhD0T/exec" \
  -H "Content-Type: application/json" \
  -d '{"score": 1200, "name": "testplayer"}'

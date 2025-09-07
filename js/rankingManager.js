/**
 * 非同期ランキングマネージャー
 * Google Apps Script APIからランキングデータを非同期で取得・管理
 */
export class RankingManager {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.isLoading = false;
        this.requestTimeout = 10000; // 10秒タイムアウト
        this.retryCount = 0;
        this.maxRetries = 3;
        
        console.log('RankingManager初期化完了:', apiUrl);
    }

    /**
     * ランキングデータを非同期で取得（常に最新データを取得）
     * @param {boolean} forceRefresh - 互換性のため残すが使用しない
     * @return {Promise<Object|null>} ランキングデータまたはnull
     */
    async fetchRanking(forceRefresh = false) {
        // 既に読み込み中の場合は重複リクエストを防ぐ
        if (this.isLoading) {
            console.log('ランキング取得中のため、リクエストをスキップ');
            await this.waitForLoading();
        }

        return await this.fetchRankingFromAPI();
    }

    /**
     * ローディング完了まで待機
     * @return {Promise}
     */
    async waitForLoading() {
        while (this.isLoading) {
            await this.sleep(100);
        }
    }

    /**
     * APIからランキングデータを取得（JSONP使用、フォールバック付き）
     * @return {Promise<Object|null>}
     */
    async fetchRankingFromAPI() {
        this.isLoading = true;
        console.log('ランキングデータ取得開始...');

        try {
            let data;
            
            try {
                // まずJSONPを試行
                console.log('JSONP方式でデータ取得を試行...');
                data = await this.fetchWithJSONP();
            } catch (jsonpError) {
                console.log('JSONP失敗、通常のfetchを試行...', jsonpError.message);
                
                // JSONPが失敗した場合、通常のfetchを試行
                try {
                    const response = await fetch(this.apiUrl);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    data = await response.json();
                    console.log('通常のfetchで取得成功');
                } catch (fetchError) {
                    console.error('通常のfetchも失敗:', fetchError);
                    throw new Error('データ取得に失敗しました');
                }
            }
            
            // レスポンス形式の検証（詳細なデバッグ情報付き）
            console.log('APIレスポンス生データ:', JSON.stringify(data, null, 2));
            console.log('データ型:', typeof data);
            console.log('data.success:', data.success);
            console.log('data.error:', data.error);
            console.log('data.top5:', data.top5);
            
            if (!this.validateRankingData(data)) {
                console.error('検証失敗 - データ詳細:', {
                    hasTop5: !!(data && data.top5),
                    isTop5Array: Array.isArray(data.top5),
                    top5Length: data.top5 ? data.top5.length : 'N/A',
                    firstItem: data.top5 && data.top5[0] ? data.top5[0] : 'N/A',
                    hasRanking: !!(data && data.ranking),
                    isRankingArray: Array.isArray(data.ranking)
                });
                throw new Error('無効なランキングデータ形式');
            }

            // データの正規化
            const normalizedData = this.normalizeRankingData(data);
            this.retryCount = 0; // 成功時はリトライカウントをリセット

            console.log('ランキングデータ取得成功:', normalizedData);
            return normalizedData;

        } catch (error) {
            console.error('ランキングデータ取得エラー:', error);
            
            // 特定のエラーの場合はリトライしない
            if (error.message.includes('無効なランキングデータ形式') && this.retryCount > 0) {
                console.log('データ形式エラーのため、リトライを停止');
                this.retryCount = 0; // リトライカウントをリセット
                return null;
            }
            
            // リトライ処理
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`リトライ ${this.retryCount}/${this.maxRetries} - エラー: ${error.message}`);
                
                // 指数バックオフ（1秒、2秒、4秒）
                const delay = Math.pow(2, this.retryCount - 1) * 1000;
                console.log(`${delay/1000}秒後にリトライします...`);
                await this.sleep(delay);
                
                return await this.fetchRankingFromAPI();
            }

            console.error('最大リトライ回数に達しました。ランキング取得を諦めます。');
            this.retryCount = 0; // リトライカウントをリセット
            return null;

        } finally {
            this.isLoading = false;
        }
    }

    /**
     * JSONP方式でデータを取得
     * @return {Promise<Object>}
     */
    fetchWithJSONP() {
        return new Promise((resolve, reject) => {
            // ユニークなコールバック名を生成
            const callbackName = 'rankingCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // タイムアウト設定
            const timeoutId = setTimeout(() => {
                this.cleanupJSONP(callbackName);
                reject(new Error('JSONP request timeout'));
            }, this.requestTimeout);

            // グローバルコールバック関数を定義
            window[callbackName] = (data) => {
                clearTimeout(timeoutId);
                this.cleanupJSONP(callbackName);
                resolve(data);
            };

            // スクリプトタグを作成してJSONPリクエストを送信
            const script = document.createElement('script');
            script.src = `${this.apiUrl}?callback=${callbackName}&_=${Date.now()}`;
            script.onerror = () => {
                clearTimeout(timeoutId);
                this.cleanupJSONP(callbackName);
                reject(new Error('JSONP script load error'));
            };

            // スクリプトをDOMに追加
            document.head.appendChild(script);
        });
    }

    /**
     * JSONP関連のクリーンアップ
     * @param {string} callbackName - コールバック関数名
     */
    cleanupJSONP(callbackName) {
        // グローバルコールバック関数を削除
        if (window[callbackName]) {
            delete window[callbackName];
        }
        
        // スクリプトタグを削除
        const scripts = document.querySelectorAll(`script[src*="${callbackName}"]`);
        scripts.forEach(script => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        });
    }

    /**
     * ランキングデータの形式を検証
     * @param {Object} data - APIレスポンスデータ
     * @return {boolean}
     */
    validateRankingData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }

        // top5形式の検証
        if (data.top5 && Array.isArray(data.top5)) {
            // 1番目がヘッダーの場合は除外
            const top5 = data.top5;
            const startIdx = (typeof top5[0].score === 'string' && typeof top5[0].name === 'string') ? 1 : 0;
            return top5.slice(startIdx).every(item => 
                item && 
                typeof item.score === 'number' && 
                typeof item.name === 'string' && 
                typeof item.date === 'string'
            );
        }

        // ranking形式の検証
        if (data.ranking && Array.isArray(data.ranking)) {
            return data.ranking.every(item => 
                item && 
                typeof item.rank === 'number' && 
                typeof item.score === 'number' && 
                typeof item.name === 'string'
            );
        }

        return false;
    }

    /**
     * ランキングデータを正規化
     * @param {Object} data - 生のAPIレスポンス
     * @return {Object} 正規化されたランキングデータ
     */
    normalizeRankingData(data) {
        let ranking = [];

        if (data.top5) {
            // top5形式を正規化（ヘッダー除外）
            const top5 = data.top5;
            const startIdx = (typeof top5[0].score === 'string' && typeof top5[0].name === 'string') ? 1 : 0;
            ranking = top5.slice(startIdx).map((item, index) => ({
                rank: index + 1,
                score: item.score,
                name: item.name,
                date: new Date(item.date).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric'
                })
            }));
        } else if (data.ranking) {
            // ranking形式はそのまま使用（日付フォーマットのみ調整）
            ranking = data.ranking.map(item => ({
                ...item,
                date: item.date ? new Date(item.date).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric'
                }) : ''
            }));
        }

        return {
            ranking: ranking,
            lastUpdated: new Date().toISOString(),
            totalPlayers: ranking.length
        };
    }
    /**
     * ローディング状態を取得
     * @return {boolean}
     */
    isLoadingRanking() {
        return this.isLoading;
    }

    /**
     * ユーザーのランキング内順位を取得
     * @param {number} userScore - ユーザーのスコア
     * @param {Object} rankingData - ランキングデータ
     * @return {number|null} 順位（1-based）またはnull（ランキング外）
     */
    getUserRank(userScore, rankingData = null) {
        // ランキングデータが渡されていない場合は最新データを取得
        if (!rankingData) {
            console.log('ランキングデータが提供されていないため、順位計算をスキップ');
            return null;
        }

        if (!rankingData.ranking) {
            return null;
        }

        const ranking = rankingData.ranking;
        for (let i = 0; i < ranking.length; i++) {
            if (userScore >= ranking[i].score) {
                return i + 1;
            }
        }

        // 最下位より低い場合
        return ranking.length + 1;
    }

    /**
     * AbortErrorかどうかを判定
     * @param {Error} error
     * @return {boolean}
     */
    isAbortError(error) {
        return error.name === 'AbortError' || error.message.includes('aborted');
    }

    /**
     * 指定時間待機
     * @param {number} ms - 待機時間（ミリ秒）
     * @return {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * スコアをランキングに投稿
     * @param {number} score - スコア
     * @param {string} name - プレイヤー名
     * @return {Promise<Object>} 投稿結果
     */
    async postScore(score, name) {
        console.log('スコア投稿開始:', { score, name });

        try {
            // 名前のバリデーション
            const nameValidation = this.validatePlayerName(name);
            if (!nameValidation.isValid) {
                throw new Error(nameValidation.error);
            }

            // スコアのバリデーション
            if (!score || score <= 0 || !Number.isInteger(score)) {
                throw new Error('スコアは正の整数である必要があります');
            }

            // まずランキングを取得して5位以内かチェック
            const currentRanking = await this.fetchRanking(true); // 強制更新
            const shouldPost = this.shouldPostToRanking(score, currentRanking);
            
            if (!shouldPost.shouldPost) {
                return {
                    success: false,
                    message: shouldPost.reason,
                    rank: null
                };
            }

            // JSONP方式でスコアを送信（CORSエラー回避）
            console.log('JSONP方式でスコア投稿を実行...');
            const result = await this.postScoreWithJSONP(score, name);
            
            if (result.success) {
                console.log('スコア投稿成功:', result);
                
                // 少し待ってから最新データを取得（サーバー側の処理完了を待つ）
                await this.sleep(1000);
                
                return {
                    success: true,
                    message: result.message,
                    rank: result.rank
                };
            } else {
                throw new Error(result.error || 'スコア投稿に失敗しました');
            }

        } catch (error) {
            console.error('スコア投稿エラー:', error);
            return {
                success: false,
                message: error.message,
                rank: null
            };
        }
    }

    /**
     * JSONP方式でスコアを投稿
     * @param {number} score - スコア
     * @param {string} name - プレイヤー名
     * @return {Promise<Object>}
     */
    postScoreWithJSONP(score, name) {
        return new Promise((resolve, reject) => {
            // ユニークなコールバック名を生成
            const callbackName = 'postCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // タイムアウト設定
            const timeoutId = setTimeout(() => {
                this.cleanupJSONP(callbackName);
                reject(new Error('スコア投稿タイムアウト'));
            }, this.requestTimeout);

            // グローバルコールバック関数を定義
            window[callbackName] = (data) => {
                clearTimeout(timeoutId);
                console.log('JSONP投稿レスポンス受信:', data);
                this.cleanupJSONP(callbackName);
                
                // レスポンスの検証
                if (data && typeof data === 'object') {
                    console.log('レスポンス詳細:', {
                        success: data.success,
                        message: data.message,
                        error: data.error,
                        rank: data.rank
                    });
                    
                    // レスポンスが空の場合はエラー処理
                    if (data.success === undefined && data.error === undefined) {
                        console.error('空のレスポンスを受信:', data);
                        reject(new Error('Google Apps Scriptから無効なレスポンスが返されました'));
                    } else {
                        resolve(data);
                    }
                } else {
                    console.error('無効なレスポンス形式:', data);
                    reject(new Error('無効なレスポンス形式'));
                }
            };

            // URLパラメータとしてスコアと名前を送信
            const url = `${this.apiUrl}?callback=${callbackName}&action=post&score=${encodeURIComponent(score)}&name=${encodeURIComponent(name)}&_=${Date.now()}`;
            
            // スクリプトタグを作成してJSONPリクエストを送信
            const script = document.createElement('script');
            script.src = url;
            script.onerror = () => {
                clearTimeout(timeoutId);
                this.cleanupJSONP(callbackName);
                reject(new Error('スコア投稿スクリプトロードエラー'));
            };

            console.log('スコア投稿URL:', url);
            
            // スクリプトをDOMに追加
            document.head.appendChild(script);
        });
    }

    /**
     * ランキングに投稿すべきかどうかを判定
     * @param {number} score - スコア
     * @param {Object} rankingData - 現在のランキングデータ
     * @return {Object} 判定結果
     */
    shouldPostToRanking(score, rankingData) {
        if (!rankingData || !rankingData.ranking) {
            // ランキングデータが取得できない場合は投稿を試す
            return {
                shouldPost: true,
                reason: 'ランキングデータを確認中...'
            };
        }

        const ranking = rankingData.ranking;
        
        // ランキングが5件未満の場合は投稿する
        if (ranking.length < 5) {
            return {
                shouldPost: true,
                reason: 'ランキングに空きがあります'
            };
        }

        // 5位のスコアと比較
        const fifthScore = ranking[4].score;
        if (score > fifthScore) {
            return {
                shouldPost: true,
                reason: `5位のスコア(${fifthScore})を上回っています`
            };
        }

        return {
            shouldPost: false,
            reason: `スコアが5位のスコア(${fifthScore})以下のため、ランキングに登録されません`
        };
    }

    /**
     * プレイヤー名のバリデーション
     * @param {string} name - プレイヤー名
     * @return {Object} バリデーション結果
     */
    validatePlayerName(name) {
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
     * 設定を更新
     * @param {Object} config - 新しい設定
     */
    updateConfig(config) {
        if (config.cacheTimeout) this.cacheTimeout = config.cacheTimeout;
        if (config.requestTimeout) this.requestTimeout = config.requestTimeout;
        if (config.maxRetries) this.maxRetries = config.maxRetries;
        
        console.log('RankingManager設定更新:', config);
    }
}

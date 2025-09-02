/**
 * 非同期ランキングマネージャー
 * Google Apps Script APIからランキングデータを非同期で取得・管理
 */
export class RankingManager {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.cachedRanking = null;
        this.isLoading = false;
        this.lastFetchTime = 0;
        this.cacheTimeout = 60000; // 1分キャッシュ
        this.requestTimeout = 10000; // 10秒タイムアウト
        this.retryCount = 0;
        this.maxRetries = 3;
        
        console.log('RankingManager初期化完了:', apiUrl);
    }

    /**
     * ランキングデータを非同期で取得
     * @param {boolean} forceRefresh - キャッシュを無視して強制更新
     * @return {Promise<Object|null>} ランキングデータまたはnull
     */
    async fetchRanking(forceRefresh = false) {
        // 既に読み込み中の場合は重複リクエストを防ぐ
        if (this.isLoading) {
            console.log('ランキング取得中のため、リクエストをスキップ');
            return this.cachedRanking;
        }

        // キャッシュが有効かチェック
        const now = Date.now();
        const cacheIsValid = this.cachedRanking && 
            (now - this.lastFetchTime) < this.cacheTimeout;

        if (!forceRefresh && cacheIsValid) {
            console.log('キャッシュされたランキングデータを返します');
            return this.cachedRanking;
        }

        return await this.fetchRankingFromAPI();
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
            
            // レスポンス形式の検証
            if (!this.validateRankingData(data)) {
                throw new Error('無効なランキングデータ形式');
            }

            // データの正規化とキャッシュ更新
            const normalizedData = this.normalizeRankingData(data);
            this.cachedRanking = normalizedData;
            this.lastFetchTime = Date.now();
            this.retryCount = 0; // 成功時はリトライカウントをリセット

            console.log('ランキングデータ取得成功:', normalizedData);
            return normalizedData;

        } catch (error) {
            console.error('ランキングデータ取得エラー:', error);
            
            // リトライ処理
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`リトライ ${this.retryCount}/${this.maxRetries}`);
                
                // 指数バックオフ（1秒、2秒、4秒）
                const delay = Math.pow(2, this.retryCount - 1) * 1000;
                await this.sleep(delay);
                
                return await this.fetchRankingFromAPI();
            }

            // 全てのリトライが失敗した場合、古いキャッシュを返す
            if (this.cachedRanking) {
                console.log('エラーのため古いキャッシュデータを返します');
                return this.cachedRanking;
            }

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
            return data.top5.every(item => 
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
            // top5形式を正規化
            ranking = data.top5.map((item, index) => ({
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
     * キャッシュされたランキングデータを取得
     * @return {Object|null}
     */
    getCachedRanking() {
        return this.cachedRanking;
    }

    /**
     * キャッシュの有効性をチェック
     * @return {boolean}
     */
    isCacheValid() {
        if (!this.cachedRanking) return false;
        
        const now = Date.now();
        return (now - this.lastFetchTime) < this.cacheTimeout;
    }

    /**
     * ローディング状態を取得
     * @return {boolean}
     */
    isLoadingRanking() {
        return this.isLoading;
    }

    /**
     * キャッシュをクリア
     */
    clearCache() {
        this.cachedRanking = null;
        this.lastFetchTime = 0;
        console.log('ランキングキャッシュをクリアしました');
    }

    /**
     * ユーザーのランキング内順位を取得
     * @param {number} userScore - ユーザーのスコア
     * @return {number|null} 順位（1-based）またはnull（ランキング外）
     */
    getUserRank(userScore) {
        if (!this.cachedRanking || !this.cachedRanking.ranking) {
            return null;
        }

        const ranking = this.cachedRanking.ranking;
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

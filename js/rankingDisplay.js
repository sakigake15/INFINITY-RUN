/**
 * ランキング表示コンポーネント
 * UI操作とランキングデータの表示を管理
 */
export class RankingDisplay {
    constructor() {
        this.rankingDisplayElement = document.getElementById('rankingDisplay');
        this.rankingErrorElement = document.getElementById('rankingError');
        this.refreshButton = document.getElementById('refreshRanking');
        
        this.setupEventListeners();
        console.log('RankingDisplay初期化完了');
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        if (this.refreshButton) {
            this.refreshButton.addEventListener('click', () => {
                this.onRefreshRequested();
            });
        }
    }

    /**
     * ローディング状態を表示
     */
    showLoading() {
        this.hideError();
        this.rankingDisplayElement.innerHTML = `
            <div class="ranking-loading">
                <div class="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    }

    /**
     * ランキングデータを表示
     * @param {Object} rankingData - 正規化されたランキングデータ
     */
    displayRanking(rankingData) {
        this.hideError();
        
        if (!rankingData || !rankingData.ranking || rankingData.ranking.length === 0) {
            this.showEmpty();
            return;
        }

        const rankingItems = rankingData.ranking.map(item => 
            this.createRankingItemHTML(item)
        ).join('');

        this.rankingDisplayElement.innerHTML = rankingItems;
        
        // 最終更新時間を表示（デバッグ用）
        console.log('ランキング表示更新:', rankingData.lastUpdated);
    }

    /**
     * ランキングアイテムのHTMLを生成
     * @param {Object} item - ランキングアイテム
     * @return {string} HTML文字列
     */
    createRankingItemHTML(item) {
        const rankText = this.getRankDisplay(item.rank);
        const nameText = item.name || '---';
        const scoreText = this.formatScore(item.score);
        
        return `
            <div class="ranking-item" data-rank="${item.rank}">
                <span class="ranking-rank">${rankText}</span>
                <span class="ranking-name">${nameText}</span>
                <span class="ranking-score">${scoreText}</span>
            </div>
        `;
    }

    /**
     * 順位の表示テキストを取得
     * @param {number} rank - 順位
     * @return {string} 表示用順位テキスト
     */
    getRankDisplay(rank) {
        switch (rank) {
            case 1:
                return '🥇';
            case 2:
                return '🥈';
            case 3:
                return '🥉';
            default:
                return `${rank}位`;
        }
    }

    /**
     * スコアを見やすい形式にフォーマット
     * @param {number} score - スコア
     * @return {string} フォーマット済みスコア
     */
    formatScore(score) {
        if (typeof score !== 'number') return '---';
        
        // 3桁区切りでカンマを追加
        return score.toLocaleString('ja-JP');
    }

    /**
     * エラー状態を表示
     * @param {string} errorMessage - エラーメッセージ
     */
    showError(errorMessage = 'ランキングの取得に失敗しました') {
        this.rankingDisplayElement.innerHTML = '';
        this.rankingErrorElement.classList.remove('hidden');
        
        const errorText = this.rankingErrorElement.querySelector('p');
        if (errorText) {
            errorText.textContent = errorMessage;
        }
    }

    /**
     * エラー表示を隠す
     */
    hideError() {
        this.rankingErrorElement.classList.add('hidden');
    }

    /**
     * 空のランキング状態を表示
     */
    showEmpty() {
        this.hideError();
        this.rankingDisplayElement.innerHTML = `
            <div class="ranking-empty">
                <p>ランキングデータがありません</p>
            </div>
        `;
    }

    /**
     * 特定のユーザーをハイライト
     * @param {string} userName - ユーザー名
     */
    highlightUser(userName) {
        const rankingItems = this.rankingDisplayElement.querySelectorAll('.ranking-item');
        
        rankingItems.forEach(item => {
            const nameElement = item.querySelector('.ranking-name');
            if (nameElement && nameElement.textContent.toLowerCase() === userName.toLowerCase()) {
                item.classList.add('highlighted-user');
            } else {
                item.classList.remove('highlighted-user');
            }
        });
    }

    /**
     * ユーザーのランク表示を更新
     * @param {number} userScore - ユーザーのスコア
     * @param {Object} rankingData - ランキングデータ
     */
    showUserRank(userScore, rankingData) {
        if (!rankingData || !rankingData.ranking) return;
        
        const userRank = this.calculateUserRank(userScore, rankingData.ranking);
        
        if (userRank <= 5) {
            // ランキング内の場合はハイライト
            this.highlightUserScore(userScore);
        } else {
            // ランキング外の場合は情報表示
            this.showRankOutInfo(userRank);
        }
    }

    /**
     * ユーザーの順位を計算
     * @param {number} userScore - ユーザーのスコア
     * @param {Array} ranking - ランキング配列
     * @return {number} 順位
     */
    calculateUserRank(userScore, ranking) {
        for (let i = 0; i < ranking.length; i++) {
            if (userScore >= ranking[i].score) {
                return i + 1;
            }
        }
        return ranking.length + 1;
    }

    /**
     * ユーザーのスコアをハイライト
     * @param {number} userScore - ユーザーのスコア
     */
    highlightUserScore(userScore) {
        const rankingItems = this.rankingDisplayElement.querySelectorAll('.ranking-item');
        
        rankingItems.forEach(item => {
            const scoreElement = item.querySelector('.ranking-score');
            if (scoreElement) {
                const scoreText = scoreElement.textContent.replace(/,/g, '');
                const itemScore = parseInt(scoreText);
                
                if (itemScore === userScore) {
                    item.classList.add('user-score');
                } else {
                    item.classList.remove('user-score');
                }
            }
        });
    }

    /**
     * ランキング外情報を表示
     * @param {number} rank - ユーザーの順位
     */
    showRankOutInfo(rank) {
        // ランキング下部に情報を追加
        const infoElement = document.createElement('div');
        infoElement.className = 'ranking-info';
        infoElement.innerHTML = `
            <p>あなたの順位: ${rank}位</p>
        `;
        
        // 既存の情報要素を削除
        const existingInfo = this.rankingDisplayElement.querySelector('.ranking-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        this.rankingDisplayElement.appendChild(infoElement);
    }

    /**
     * 再読み込みボタンが押された時のコールバック設定
     * @param {Function} callback - コールバック関数
     */
    setRefreshCallback(callback) {
        this.refreshCallback = callback;
    }

    /**
     * 再読み込みボタンが押された時の処理
     */
    onRefreshRequested() {
        if (this.refreshCallback && typeof this.refreshCallback === 'function') {
            this.refreshCallback();
        }
    }

    /**
     * アニメーション効果を適用
     */
    applyAnimations() {
        const items = this.rankingDisplayElement.querySelectorAll('.ranking-item');
        
        items.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
        });
    }

    /**
     * 表示状態をリセット
     */
    reset() {
        this.hideError();
        this.rankingDisplayElement.innerHTML = '';
        console.log('RankingDisplay表示状態をリセット');
    }

    /**
     * 読み込み中かどうかを判定
     * @return {boolean}
     */
    isLoading() {
        return this.rankingDisplayElement.querySelector('.ranking-loading') !== null;
    }

    /**
     * エラー表示中かどうかを判定
     * @return {boolean}
     */
    isShowingError() {
        return !this.rankingErrorElement.classList.contains('hidden');
    }

    /**
     * データが表示されているかどうかを判定
     * @return {boolean}
     */
    hasData() {
        const items = this.rankingDisplayElement.querySelectorAll('.ranking-item');
        return items.length > 0;
    }
}

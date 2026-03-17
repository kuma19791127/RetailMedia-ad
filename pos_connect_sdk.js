/**
 * LiteAd POS Connect SDK (v1.0.0)
 * リテールメディア「リテアド」成果報酬型連動用SDK
 * 
 * Usage:
 * const liteAd = new LiteAdPOS('API_KEY_XXXX');
 * liteAd.trackSale({ transactionId: 'TX123', amount: 1500, items: ['driscoll_berry'] });
 */

class LiteAdPOS {
    constructor(apiKey, endpoint = 'http://localhost:3000') {
        this.apiKey = apiKey;
        this.endpoint = endpoint;
        console.log(`[LiteAd POS] Initialized with Key: ${apiKey.substring(0, 5)}...`);
    }

    /**
     * 売上確定時に呼び出す
     * @param {Object} data - { transactionId, amount, items: [], timestamp }
     */
    async trackSale(data) {
        if (!data.amount) {
            console.error('[LiteAd POS] Error: "amount" is required.');
            return;
        }

        const payload = {
            ...data,
            timestamp: data.timestamp || new Date().toISOString(),
            source: 'POS_SDK'
        };

        try {
            const res = await fetch(`${this.endpoint}/api/external/v1/event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(payload)
            });

            const responseParams = await res.json();
            if (res.ok) {
                console.log(`[LiteAd POS] Tracking Success:`, responseParams);
                return responseParams;
            } else {
                console.error(`[LiteAd POS] Tracking Failed:`, responseParams);
                throw new Error(responseParams.error || 'Unknown Error');
            }

        } catch (e) {
            console.error('[LiteAd POS] Network Error:', e);
            throw e;
        }
    }

    /**
     * 現在配信中の広告枠情報を取得（レジ側でのクロスセル提案などに利用）
     */
    async getActiveCampaigns() {
        try {
            const res = await fetch(`${this.endpoint}/api/external/v1/inventory`, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });
            return await res.json();
        } catch (e) {
            console.error('[LiteAd POS] Inventory Fetch Error:', e);
            return [];
        }
    }
}

// Browser / Node.js Compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LiteAdPOS;
} else {
    window.LiteAdPOS = LiteAdPOS;
}

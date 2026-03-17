const https = require('https');
const querystring = require('querystring');

// GMO Test Environment Configuration
// Documentation: https://kt01.mul-pay.jp/mulpayconsole/site/tsite00060273/dashboard/codesample/credit/java#listblock
const GMO_CONFIG = {
    host: 'pt01.mul-pay.jp',
    shopId: 'tsite00060273', // Provided by user
    shopPass: '58s7ra2z'     // Standard test password for this shop ID
};

function callGmoApi(path, data) {
    return new Promise((resolve, reject) => {
        const postData = querystring.stringify(data);
        const options = {
            hostname: GMO_CONFIG.host,
            path: `/payment/${path}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                // Parse Query String response (Standard GMO format)
                const result = querystring.parse(body);
                if (result.ErrCode) {
                    reject(result);
                } else {
                    resolve(result);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

/**
 * Process a Credit Card Payment (EntryTran -> ExecTran)
 */
async function processPayment(orderId, amount, cardInfo) {
    try {
        console.log(`[GMO] Starting Payment for Order: ${orderId}, Amount: ${amount}`);

        // 1. EntryTran (Register Transaction)
        const entryData = {
            ShopID: GMO_CONFIG.shopId,
            ShopPass: GMO_CONFIG.shopPass,
            OrderID: orderId,
            JobCd: 'CAPTURE', // Instant Capture
            Amount: amount
        };

        const entryResult = await callGmoApi('EntryTran.idPass', entryData);
        console.log('[GMO] EntryTran Success:', entryResult);

        // 2. ExecTran (Execute Payment)
        const execData = {
            AccessID: entryResult.AccessID,
            AccessPass: entryResult.AccessPass,
            OrderID: orderId,
            Method: '1', // Lump sum
            CardNo: cardInfo.cardNo,
            Expire: cardInfo.expire, // YYMM
            SecurityCode: cardInfo.securityCode
        };

        const execResult = await callGmoApi('ExecTran.idPass', execData);
        console.log('[GMO] ExecTran Success:', execResult);

        return { success: true, ...execResult };

    } catch (error) {
        console.error('[GMO] Payment Failed:', error);
        return { success: false, error: error };
    }
}

module.exports = { processPayment };

// Square Web Payments SDK Integration
const SQUARE_APP_ID = "sq0idp-dEBc0wMfUZp6crtfka8HeQ";
const SQUARE_LOC_ID = "LABSDKNFWBN1R";

async function initializeSquarePayment(amount, containerId, onSuccess) {
    if (!window.Square) {
        console.error("Square.js not loaded");
        return;
    }

    try {
        const payments = window.Square.payments(SQUARE_APP_ID, SQUARE_LOC_ID);
        
        // Setup Card Payment
        const card = await payments.card();
        await card.attach('#' + containerId);

        // Setup Google Pay
        let googlePay;
        try {
            const paymentRequest = payments.paymentRequest({
                countryCode: 'JP',
                currencyCode: 'JPY',
                total: {
                    amount: amount.toString(),
                    label: 'Total',
                },
            });
            googlePay = await payments.googlePay(paymentRequest);
            await googlePay.attach('#google-pay-button');
        } catch (e) {
            console.warn("Google Pay not available", e);
        }

        document.getElementById('sq-creditcard').addEventListener('click', async () => {
            const statusContainer = document.getElementById('sq-status');
            statusContainer.innerText = "処理中...";
            try {
                const result = await card.tokenize();
                if (result.status === 'OK') {
                    await processSquarePayment(result.token, amount, onSuccess);
                } else {
                    statusContainer.innerText = "エラー: " + result.errors[0].message;
                }
            } catch (e) {
                statusContainer.innerText = "エラーが発生しました";
            }
        });

        if (googlePay) {
            document.getElementById('google-pay-button').addEventListener('click', async () => {
                const statusContainer = document.getElementById('sq-status');
                statusContainer.innerText = "Google Pay 処理中...";
                try {
                    const result = await googlePay.tokenize();
                    if (result.status === 'OK') {
                        await processSquarePayment(result.token, amount, onSuccess);
                    } else {
                        statusContainer.innerText = "Google Pay エラー";
                    }
                } catch (e) {
                    statusContainer.innerText = "Google Pay エラー";
                }
            });
        }
    } catch (e) {
        console.error("Square Init Error", e);
    }
}

async function processSquarePayment(token, amount, onSuccess) {
    const API_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:') ? 'http://localhost:3000' : '';
    try {
        // Send data to backend hook (admin_portal sync)
        const res = await fetch(API_URL + '/api/payment/square-charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token, amount: amount, source: window.location.pathname })
        });
        
        if (res.ok) {
            document.getElementById('sq-status').innerText = "決済完了！";
            onSuccess();
        } else {
            document.getElementById('sq-status').innerText = "決済失敗: サーバーエラー";
        }
    } catch (e) {
        console.error(e);
        document.getElementById('sq-status').innerText = "通信エラー";
    }
}

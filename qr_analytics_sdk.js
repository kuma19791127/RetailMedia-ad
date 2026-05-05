// QR Analytics SDK (Mock)
// 顧客のスマホ情報を解析する (性別・年齢削除 / アクセス元削除 / OSのみ分析)

console.log("QR Analytics SDK Initialized");

const QRAnalytics = {
  trackScan: (params) => {
    const ua = navigator.userAgent;
    console.log(`[SDK] Tracking scan from: ${ua}`);

    // 1. Detect OS Only
    let os = 'Other';
    if (ua.match(/iPhone|iPad|iPod/i)) os = 'iOS';
    else if (ua.match(/Android/i)) os = 'Android';

    const deviceData = {
      os: os,
      ua_raw: ua
    };

    console.log(`[SDK] Device Analysis:`, deviceData);
    // fetch('/api/ad/report/qr', { method: 'POST', body: JSON.stringify({...params, ...deviceData}) });

    return deviceData;
  }
};

module.exports = QRAnalytics;

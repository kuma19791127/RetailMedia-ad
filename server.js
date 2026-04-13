const express = require('express');
const cors = require('cors');
const path = require('path');
const inventoryDB = require('./inventory_db');
const spApiClient = require('./sp_api_client');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({limit: '10mb', extended: true}));

// Suppress favicon 404
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Serve Mobile App (PWA) for testing
app.use('/app', express.static(path.join(__dirname, '../')));

// Serve Dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});


// API: Authentication Login
app.post('/api/auth/login', (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'メールアドレスとパスワードを入力してください。' });
    }
    // For demo purposes, we accept any credentials
    console.log('[Auth] Login successful for:', email);
    res.json({ success: true, token: 'demo_token_' + Date.now(), role: role || 'store' });
});


// --- Global Memory DB for Demos ---
let campaignsDB = [
    {
        id: "cmp_demo_001",
        name: "サザンウォーター (新商品枠)",
        budget: 50000,
        spent: 1250,
        status: "active",
        plan: "impression",
        createdAt: new Date().toISOString()
    },
    {
        id: "cmp_demo_002",
        name: "アサヒ生ビール 黒生 (雨の日特価)",
        budget: 35000,
        spent: 0,
        status: "pending",
        plan: "moment",
        createdAt: new Date().toISOString()
    }
];



// --- AI Vision Image Scanning (Google Cloud Vision) ---
const vision = require('@google-cloud/vision');
const { VertexAI } = require('@google-cloud/vertexai');
// Will rely on google credentials in .env or the JSON file
let visionClientOptions = {};
// AWS環境用（それぞれの変数が個別に設定されている場合）
if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    visionClientOptions.credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        // 改行文字がエスケープされている場合への対応
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
}
// もしくはJSON直接設定
else if (process.env.GCP_CREDENTIALS) {
    try {
        visionClientOptions.credentials = JSON.parse(process.env.GCP_CREDENTIALS);
    } catch(err) {}
}
// ローカル環境用（ファイルが存在する場合）
else if (fs.existsSync('./my-project-89579lifeai-98e749e02c3e.json')) {
    visionClientOptions.keyFilename = './my-project-89579lifeai-98e749e02c3e.json';
} 
const visionClient = new vision.ImageAnnotatorClient(visionClientOptions);

// Vertex AI (Gemini 1.5) の初期化
const vertexai = new VertexAI({
    project: 'my-project-89579lifeai',
    location: 'us-central1',
    googleAuthOptions: visionClientOptions.keyFilename ? { keyFilename: visionClientOptions.keyFilename } : { credentials: visionClientOptions.credentials }
});
const generativeModel = vertexai.preview.getGenerativeModel({
    model: 'gemini-1.5-pro-preview-0409',
    generationConfig: { maxOutputTokens: 2048, temperature: 0.4 }
});

app.post('/api/kyc/scan', async (req, res) => {
    try {
        const { imageFileBase64 } = req.body;
        if (!imageFileBase64) return res.status(400).json({ error: "No image provided" });

        // Remove header data:image/jpeg;base64,
        const base64Data = imageFileBase64.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Document Text Detection
        const [result] = await visionClient.documentTextDetection(imageBuffer);
        const fullText = result.fullTextAnnotation ? result.fullTextAnnotation.text : '';

        // Validate if it has words related to Corporate Registration or looks like a document
        if (fullText.includes("履歴") || fullText.includes("登記") || fullText.includes("証明") || fullText.length > 50) {
            res.json({ success: true, text: fullText });
        } else {
            // It could be too blurry to extract enough text
            res.json({ success: false, reason: "blurry", text: fullText });
        }

    } catch (e) {
        console.error("GCP Vision API Error:", e.message);
        // Fallback for demo when the API key is missing
        res.json({ success: true, fake: true, message: "FALLBACK: API Key error, simulating success." });
    }
});

// --- KYC (Account Review) Memory DB ---
let kycDB = [];

app.post('/api/kyc', (req, res) => {
    const kyc = {
        id: "kyc_" + Date.now(),
        corpId: req.body.corpId,
        duns: req.body.duns,
        status: "pending",
        userEmail: req.body.email || "demo@advertiser.com",
        createdAt: new Date().toISOString()
    };
    kycDB.push(kyc);
    res.json({ success: true, kyc });
});

app.get('/api/kyc', (req, res) => {
    res.json(kycDB);
});

app.post('/api/kyc/:id/status', (req, res) => {
    const kyc = kycDB.find(k => k.id === req.params.id);
    if(kyc) kyc.status = req.body.status;
    res.json({ success: true });
});

// API: Get Campaigns
app.get('/api/campaigns', (req, res) => {
    res.json(campaignsDB);
});

// API: Create Campaign
app.post('/api/campaigns', (req, res) => {
    const newCamp = {
        id: "cmp_" + Date.now(),
        name: req.body.name || "名称未設定",
        budget: parseInt(req.body.budget) || 1000,
        spent: 0,
        status: "active", // Freely posted like YouTube
        plan: req.body.plan || "impression",
        trigger: req.body.trigger,
        target_imp: req.body.target_imp,
        bid_max: req.body.bid_max,
        url: req.body.url,
        createdAt: new Date().toISOString()
    };
    campaignsDB.push(newCamp);
    // Return the new camp and success
    res.json({ success: true, campaign: newCamp });
});

// API: Update Campaign Status
app.post('/api/campaigns/:id/status', (req, res) => {
    const camp = campaignsDB.find(c => c.id === req.params.id);
    if (!camp) return res.status(404).json({ error: "Campaign not found" });
    
    // allow paused, active, rejected, pending
    if(req.body.status) {
        camp.status = req.body.status;
    }
    res.json({ success: true, campaign: camp });
});

// API: Get Store Profile/Revenue config
app.get('/api/store/revenue', (req, res) => {
    res.json({
        totalRevenue: 24500,
        pendingApproval: campaignsDB.filter(c => c.status === "pending").length,
        activeCampaigns: campaignsDB.filter(c => c.status === "active").length
    });
});

// API: Get Inventory Status (for Dashboard)
app.get('/api/inventory', (req, res) => {
    res.json(inventoryDB.getAll());
});

// Batch: Run Morning Batch (Fetch Amazon Orders & Reserve Stock)
app.post('/api/batch/morning', async (req, res) => {
    try {
        console.log("Starting Morning Batch...");
        // 1. Fetch Orders from Amazon
        const orders = await spApiClient.fetchOrders();

        // 2. Process Reserves
        const results = [];
        orders.forEach(order => {
            order.items.forEach(item => {
                const reserveResult = inventoryDB.reserve(item.sku, item.quantity);
                if (reserveResult) {
                    results.push({
                        orderId: order.amazonOrderId,
                        sku: item.sku,
                        qty: item.quantity,
                        success: true,
                        risk: reserveResult.isRisk
                    });
                }
            });
        });

        console.log("Morning Batch Completed.");
        res.json({
            message: "Morning Batch Completed",
            processedOrders: orders.length,
            details: results
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Reset DB (for Demo)
app.post('/api/reset', (req, res) => {
    inventoryDB.reset();
    res.json({ message: "Inventory Reset" });
});

// --- Social Commerce API (Phase 5) ---
const socialEngine = require('./social_engine');
const mockWMS = require('./mock_wms');

// Creator Dashboard
app.get('/creator', (req, res) => {
    res.sendFile(path.join(__dirname, 'creator_dashboard.html'));
});

// Get Creator Stats
app.get('/api/creator/:id/stats', (req, res) => {
    res.json(socialEngine.getCreatorStats(req.params.id));
});

// Simulate Buy Logic (Recipe Bundler -> Conversion)
app.post('/api/recipe/:id/buy', (req, res) => {
    const result = socialEngine.trackConversion(req.params.id);
    if (result) {
        res.json({ success: true, newStats: result });
    } else {
        res.status(404).json({ error: "Recipe not found" });
    }
});

// WMS: Check Delivery Slot
app.get('/api/wms/slots', (req, res) => {
    res.json(mockWMS.getSlots());
});

// --- Retail Media API (Phase 6) ---
const adEngine = require('./ad_engine');
const signageServer = require('./signage_server');

// Advertiser Dashboard
app.get('/advertiser', (req, res) => {
    res.sendFile(path.join(__dirname, 'ad_dashboard.html'));
});

// Business LP (New)
app.get('/business-lp', (req, res) => {
    res.sendFile(path.join(__dirname, 'business_lp.html'));
});

// Advertiser LP (New)
app.get('/advertiser-lp', (req, res) => {
    res.sendFile(path.join(__dirname, 'advertiser_lp.html'));
});

// Agency LP (Portal Entrance)
app.get('/agency-portal', (req, res) => {
    res.sendFile(path.join(__dirname, 'agency_lp.html'));
});

// Agency Dashboard (Logged In)
app.get('/agency-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'agency_portal.html'));
});

// Analytics Data Endpoint (Attribution + Sigmoid)
app.get('/api/ad/analytics', (req, res) => {
    // Demo: Simulate some ad plays
    const mockPlayLogs = [
        { id: "ad_beer_001", sku: "4977634803472", timestamp: new Date().toISOString() },
        { id: "ad_beer_001", sku: "4977634803472", timestamp: new Date().toISOString() }
    ];

    const attribution = adEngine.calculateAttribution(mockPlayLogs);
    const analysis = adEngine.analyzeThreshold();

    res.json({
        attribution,
        analysis
    });
});

// Signage CMS: Get Playlist
app.get('/api/signage/playlist', (req, res) => {
    const location = req.query.location || 'register_side';
    res.json(signageServer.getPlaylist(location));
});


// --- マニュアル生成: 動画解析API (Vertex AI Gemini 1.5 Pro) ---
app.post('/api/manualhelp/video-to-steps', async (req, res) => {
    try {
        const { video_base64 } = req.body;
        if (!video_base64 || video_base64 === "mock_data") {
            // モックモード（フロントエンドのテスト用）
            return res.json({
                success: true,
                steps: [
                    { time: '0:01', desc: '[AI自動生成] ※これはデモデータです。実際の動画をアップロードしてください。' },
                    { time: '0:05', desc: '商品パッケージのバーコードを真上に向けます。' },
                    { time: '0:10', desc: 'ハンディスキャナーを商品の10cm上にかざし、ボタンを押します。' }
                ]
            });
        }
        
        // Base64からヘッダー(data:video/mp4;base64,)を除去
        const base64Data = video_base64.replace(/^data:video\/\w+;base64,/, "");
        
        console.log("動画解析開始: Gemini 1.5 Pro");
        
        const request = {
            contents: [{
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            mimeType: 'video/mp4',
                            data: base64Data
                        }
                    },
                    { text: 'この動画は倉庫や店舗での業務手順を撮影したものです。作業の流れを順番に、わかりやすい日本語のマニュアルとしてステップ・バイ・ステップで書き出してください。出力形式は「1. 〇〇を行います。\n2. 〇〇に注意します。」のようにシンプルにお願いします。' }
                ]
            }]
        };

        const result = await generativeModel.generateContent(request);
        const response = await result.response;
        const text = response.candidates[0].content.parts[0].text;
        
        console.log("解析完了");
        
        // テキストを行ごとに分解してステップ化
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const generatedSteps = lines.map((l, index) => {
            return {
                time: `0:0${index + 1}`, // 仮のタイムスタンプ
                desc: l.replace(/^\d+[.\s]*/, '') // 先頭の数字等を除去
            }
        });
        
        res.json({ success: true, steps: generatedSteps });
        
    } catch (error) {
        console.error('動画解析エラー:', error);
        res.status(500).json({ error: '動画の解析に失敗しました。ファイルが大きすぎるか、APIが未設定です。' });
    }
});


// --- クリエイター: コンテンツ審査API (Vertex AI Gemini 1.5 Pro) ---
app.post('/api/creator/review-content', async (req, res) => {
    try {
        const { video_base64 } = req.body;
        
        console.log("クリエイター動画審査開始: Gemini 1.5 Pro");
        
        if (!video_base64) {
             return res.status(400).json({ error: '動画データがありません' });
        }
        
        if (video_base64 === "mock_data" || video_base64.length < 500) {
             // Mock fallback
             return res.json({ safe: true, message: "審査通過 (デモ用自動パス)" });
        }

        const base64Data = video_base64.replace(/^data:video\/\w+;base64,/, "");

        const request = {
            contents: [{
                role: 'user',
                parts: [
                    { inlineData: { mimeType: 'video/mp4', data: base64Data } },
                    { text: 'あなたは広告プラットフォームの厳格なAIモデレーターです。以下に該当する不適切なコンテンツが含まれていないか審査してください。1: 過度な暴力、性的描写、ヘイトスピーチ等の公序良俗に反する内容。 2: 「必ず儲かる」「投資で稼ぐ」といった投資詐欺・誇大広告。 3: 「続きはLINEで」「LINE登録はこちら」などのLINEや外部SNSへ誘導し情報商材を売るようなスパム・詐欺的誘導。これらが少しでも含まれる場合は必ず「FAIL: 理由」を、完全に安全な小売広告であれば「PASS: 理由」を出力してください。' }
                ]
            }]
        };

        const result = await generativeModel.generateContent(request);
        const response = await result.response;
        const text = response.candidates[0].content.parts[0].text;
        
        console.log("クリエイター動画審査完了:", text);
        
        if (text.includes('FAIL')) {
            res.json({ safe: false, message: text });
        } else {
            res.json({ safe: true, message: text });
        }
        
    } catch (error) {
        console.error('コンテンツ審査エラー:', error);
        res.status(500).json({ error: '審査中にエラーが発生しました。ファイルサイズが大きすぎる可能性があります。', safe: true });
    }
});


// ==== Agency Portal Endpoints ====
let agencyReferrals = [];

app.get('/api/admin/agency', (req, res) => {
    res.json(agencyReferrals);
});

app.post('/api/admin/agency-submit', (req, res) => {
    const data = req.body;
    data.id = 'ag_' + Date.now();
    data.status = 'Pending';
    agencyReferrals.push(data);
    res.json({ success: true, item: data });
});
// =================================


app.listen(PORT, () => {
    console.log(`Anywhere Connect Middleware running at http://localhost:${PORT}`);
    console.log(`- Operator Dashboard:   http://localhost:${PORT}/`);
    console.log(`- Creator Dashboard:    http://localhost:${PORT}/creator`);
    console.log(`- Advertiser Dashboard: http://localhost:${PORT}/advertiser`);
});

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin_portal.html')));
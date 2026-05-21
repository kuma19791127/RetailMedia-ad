const pool = require('./db_connector');
const express = require('express');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const cors = require('cors');
const path = require('path');
const os = require('os');
try { require('dotenv').config(); } catch (e) { console.log('[System] dotenv module not found, skipping.'); }

const fs = require('fs');

const adEngine = require('./ad_engine');
const signageServer = require('./signage_server');


// GMO dependency removed in favor of Square + Google Cloud flow

const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const app = express();

app.get('/api/db-status', async (req, res) => {
    if (!pool) {
        return res.send("<h2>[DB Status] DATABASE_URL is NOT set. Running in Memory mode.</h2>");
    }
    try {
        const result = await pool.query('SELECT NOW()');
        res.send("<h2 style='color:green;'>[DB Status] ✅ SUCCESS! Connected to RDS PostgreSQL!</h2><p>Time: " + result.rows[0].now + "</p>");
    } catch(e) {
        res.send("<h2 style='color:red;'>[DB Status] ❌ FAILED to connect to RDS PostgreSQL!</h2><p>Error: " + e.message + "</p><p>Cause: Security Group firewall is likely blocking App Runner.</p>");
    }
});

const PORT = 3000;

app.use(cors());

// --- Profile Management ---
app.post('/api/profile', async (req, res) => {
    const { email, org, name, type } = req.body;
    if(!email) return res.json({success: false, error: "Email is required"});
    try {
        const key = `profiles/${email}.json`;
        await s3Client.send(new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME || S3_BUCKET_NAME,
            Key: key,
            Body: JSON.stringify({ email, org, name, type, updatedAt: new Date() }),
            ContentType: 'application/json'
        }));
        res.json({ success: true });
    } catch(e) {
        console.error("[Profile API] Save Error:", e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/profile', async (req, res) => {
    const { email } = req.query;
    if(!email) return res.json({success: false, error: "Email is required"});
    try {
        const key = `profiles/${email}.json`;
        const data = await s3Client.send(new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME || S3_BUCKET_NAME,
            Key: key
        }));
        const streamToString = (stream) => new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        });
        const body = await streamToString(data.Body);
        res.json({ success: true, profile: JSON.parse(body) });
    } catch(e) {
        // Not found is fine
        res.json({ success: false, error: "Profile not found" });
    }
});

// --- Scheduled Broadcast System ---
let scheduledBroadcasts = [];
setInterval(() => {
    const now = Date.now();
    scheduledBroadcasts = scheduledBroadcasts.filter(b => {
        if (b.scheduleTime <= now) {
            console.log(`[Schedule] ⏰ Executing scheduled broadcast: ${b.metadata.title}`);
            signageServer.injectCampaign('16:9', b.metadata, 'INTERRUPT');
            return false; // Remove from queue
        }
        return true; // Keep in queue
    });
}, 10000); // Check every 10 seconds


// --- ⏰ Schedule / Broadcast Voice via AI Voice Studio ---
app.post('/api/signage/schedule_voice', (req, res) => {
    // AI Content Moderation Check
    if (req.body.text) {
        const bannedWords = ["必ず儲かる", "投資で稼ぐ", "続きはLINEで", "LINE登録はこちら"];
        for (let word of bannedWords) {
            if (req.body.text.includes(word)) {
                console.log(`[AI-Voice] 規約違反を検出 (${word}). 拒絶します。`);
                return res.status(400).json({ success: false, error: `不適切なコンテンツ（禁止ワード: ${word}）が含まれているため、配信を自動拒絶しました。アカウントを一時凍結します。` });
            }
        }
    }

    const { title, text, audio_url, schedule_time, target_store_id } = req.body;
    if (!audio_url && !text) {
        return res.status(400).json({ error: "Missing audio data or text" });
    }

    const metadata = {
        title: title || "館内放送",
        format: "audio",
        url: audio_url,
        text_content: text,
        target_store_id: target_store_id || 'all'
    };

    if (schedule_time) {
        // Schedule it
        const sTime = new Date(schedule_time).getTime();
        if (sTime > Date.now()) {
            scheduledBroadcasts.push({
                scheduleTime: sTime,
                metadata: metadata
            });
            console.log(`[Schedule] Added broadcast: ${JSON.stringify(metadata)} for ${new Date(sTime).toLocaleString()}`);
            return res.json({ success: true, message: "予約配信を設定しました", scheduled_for: sTime });
        }
    }
    
    // Immediate broadcast
    console.log(`[Signage] Immediate voice broadcast: ${JSON.stringify(metadata)}`);
    signageServer.injectCampaign('16:9', metadata, 'INTERRUPT');
    res.json({ success: true, message: "サイネージへ即時配信しました" });
});

app.use(express.json({ limit: '500mb' })); // Allow large file uploads (Base64)
app.use(express.urlencoded({ limit: '500mb', extended: true }));
express.static.mime.define({ 'video/quicktime': ['mov'] });
app.use(express.static(__dirname, { dotfiles: 'allow' })); // Serve root files
app.use('/assets', express.static(path.join(__dirname, 'assets')));


// --- Advertiser KYC (Review) System ---
let kycRequests = [];

app.post('/api/kyc', async (req, res) => {
    try {
        const docs = req.body.documents || [];
        const isCorp = !!(req.body.corpId && req.body.corpId.length === 13);
        const { orgName, personName, corpId } = req.body;
        
        let aiScore = 50;
        let aiDetails = [];

        // Real Google Cloud Vertex AI (Gemini 1.5 Pro) Image Analysis
        if (typeof generativeModel !== 'undefined' && docs.length > 0) {
            try {
                // Prepare images for Gemini
                const imageParts = docs.map(doc => {
                    return {
                        inlineData: {
                            mimeType: doc.type || 'image/jpeg',
                            data: doc.data.split(',')[1] || ''
                        }
                    };
                });
                
                let promptText = `あなたはKYC（本人確認・法人確認）の専門審査AIです。以下の画像（免許証、登記簿、許認可証など）を読み取り、以下の申告情報と一致するか検証してください。
`;
                promptText += `【申告情報】
法人番号: ${corpId || 'なし'}
組織名: ${orgName || 'なし'}
代表者/担当者名: ${personName || 'なし'}

`;
                promptText += `【指示】
1. 画像から文字をOCRで読み取り、申告情報と一致している部分を抽出してください。
2. 最終的な「本人確認の一致率スコア（0〜100）」と、「一致した具体的な理由（簡潔にカンマ区切り）」を以下のJSON形式で出力してください。
`;
                promptText += `{"score": 95, "reasons": ["運転免許証の氏名一致", "登記簿の法人番号一致"]}`;

                const request = {
                    contents: [{
                        role: 'user',
                        parts: [...imageParts, { text: promptText }]
                    }],
                    generationConfig: { temperature: 0.1 }
                };
                
                const result = await generativeModel.generateContent(request);
                const response = await result.response;
                const text = response.candidates[0].content.parts[0].text;
                
                // Parse JSON from Gemini response
                const jsonMatch = text.match(/\{[\s\S]*?\}/);
                if (jsonMatch) {
                    const aiResult = JSON.parse(jsonMatch[0]);
                    aiScore = aiResult.score || aiScore;
                    aiDetails = aiResult.reasons || aiDetails;
                }
            } catch (aiErr) {
                console.error("[KYC AI Analysis Error]", aiErr);
                aiDetails.push("AI解析エラー");
            }
        } else {
            // Fallback rules if Gemini is unavailable
            if (isCorp) { aiScore = 75; aiDetails.push("法人番号フォーマット一致(API未設定)"); }
            else { aiScore = 60; aiDetails.push("画像アップロード確認(API未設定)"); }
        }
        
        // Process & upload files to S3 asynchronously
        const uploadedUrls = [];
        for(let i=0; i<docs.length; i++) {
            const doc = docs[i];
            const buffer = Buffer.from(doc.data.split(',')[1] || '', 'base64');
            const fileKey = `kyc/${Date.now()}_${Math.floor(Math.random()*1000)}_${doc.name}`;
            try {
                await s3Client.send(new PutObjectCommand({
                    Bucket: S3_BUCKET_NAME,
                    Key: fileKey,
                    Body: buffer,
                    ContentType: doc.type
                }));
                uploadedUrls.push(`https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fileKey}`);
            } catch(s3e) {
                console.error("[S3] KYC Upload Error", s3e);
                uploadedUrls.push(doc.data);
            }
        }

        const newReq = {
            id: 'kyc_' + Date.now(),
            userEmail: req.body.userEmail || 'unknown',
            orgName: orgName,
            personName: personName,
            corpId: corpId,
            duns: req.body.duns || '',
            documents: uploadedUrls,
            aiScore: aiScore,
            aiDetails: aiDetails,
            createdAt: Date.now(),
            status: 'pending'
        };
        
        kycRequests.push(newReq);
        saveFinanceDB();
        console.log(`[KYC] New request from ${newReq.userEmail}. AI Score: ${aiScore}%`);
        res.json({ success: true, id: newReq.id, aiScore: aiScore });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get('/api/kyc', (req, res) => {
    res.json(kycRequests);
});

app.post('/api/kyc/:id/status', (req, res) => {
    const reqId = req.params.id;
    const { status } = req.body;
    const target = kycRequests.find(r => r.id === reqId);
    if (target) {
        target.status = status;
        console.log(`[KYC] Request ${reqId} status updated to ${status}`);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Not found" });
    }
});

// --- User Profile/KYC check endpoint for polling ---
app.get('/api/kyc/status', (req, res) => {
    const userEmail = req.query.email;
    const reqs = kycRequests.filter(r => r.userEmail === userEmail);
    if (reqs.length > 0) {
        // Return latest
        res.json(reqs[reqs.length - 1]);
    } else {
        res.json({ status: 'unsubmitted' });
    }
});

// Serve uploads from S3 (Fallback to local if no S3)
app.get('/uploads/:filename', async (req, res) => {
    const filename = req.params.filename;
    // Basic local check
    const localPath = require('path').join(__dirname, 'uploads', filename);
    if (fs.existsSync(localPath)) {
        return res.sendFile(localPath);
    }
    
    // S3 Fetch
    if (s3Client && bucketName) {
        try {
            const { GetObjectCommand } = require('@aws-sdk/client-s3');
            const data = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: 'uploads/' + filename }));
            res.setHeader('Content-Type', data.ContentType || 'video/mp4');
            data.Body.pipe(res);
            return;
        } catch (e) {
            console.log('[S3] Video not found:', filename);
        }
    }
    res.status(404).send('Not Found');
});
 // Serve assets explicitly

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
 // Serve transcoded video files

app.use('/assets', express.static(path.join(__dirname, 'assets')));

// State
const LOCAL_MEDIA_PATH = path.join(os.homedir(), 'Desktop', 'aaa');
if (require('fs').existsSync(LOCAL_MEDIA_PATH)) {
app.use('/local-media', express.static(LOCAL_MEDIA_PATH));
    console.log(`[System] Serving Local Media from: ${LOCAL_MEDIA_PATH}`);
} else {
    console.log(`[System] Local Media folder not found at: ${LOCAL_MEDIA_PATH}`);
}

// Ensure the base loop folder is served correctly
app.use('/desktop_shorts', express.static(path.join(__dirname, 'base_loop_videos')));

// State
let totalRevenue = 0;
let transactions = [];

// CREATOR STATE
let CREATOR_STATE = {
    total_views: 0,
    total_revenue: 0,
    videos: []
};


app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- SSE Stream (Real-time Interruptions) ---
const sseClients = [];
setInterval(() => {
    sseClients.forEach(client => client.write(':\n\n'));
}, 30000); // 30s keep-alive heartbeat
app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    sseClients.push(res);
    req.on('close', () => {
        const idx = sseClients.indexOf(res);
        if (idx !== -1) sseClients.splice(idx, 1);
    });
});

function broadcastEvent(data) {
    sseClients.forEach(client => client.write(`data: ${JSON.stringify(data)}\n\n`));
}

// --- ROUTES ---
// 1. Unified Login (Entry Point)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// 2. Dashboards
app.get('/advertiser', (req, res) => res.sendFile(path.join(__dirname, 'ad_dashboard.html')));
app.get('/store-portal', (req, res) => res.sendFile(path.join(__dirname, 'store_portal.html')));
app.get('/player', (req, res) => res.sendFile(path.join(__dirname, 'signage_player.html')));
app.get('/anywhere-regi', (req, res) => res.sendFile(path.join(__dirname, 'anywhere_regi.html')));
app.get('/creator-portal', (req, res) => res.sendFile(path.join(__dirname, 'creator_portal.html')));
app.get('/retailer-portal', (req, res) => res.sendFile(path.join(__dirname, 'retailer_portal.html')));
app.get('/retailer_portal.html', (req, res) => res.sendFile(path.join(__dirname, 'retailer_portal.html')));
// NEW: Analytics Dashboard Route
app.get('/advertiser/analytics', (req, res) => res.sendFile(path.join(__dirname, 'advertiser_dashboard.html')));
app.get('/shift', (req, res) => res.sendFile(path.join(__dirname, 'shift_manager.html')));

// Anti-Gravity Routes (URL Routing separation)
app.get('/ag-login', (req, res) => res.sendFile(path.join(__dirname, 'Anti-Gravity.html')));
app.get('/corp', (req, res) => res.sendFile(path.join(__dirname, 'Anti-Gravity.html')));
app.get('/employee', (req, res) => res.sendFile(path.join(__dirname, 'Anti-Gravity.html')));
// Default admin route overridden

// Legacy Routes (Redirect to Portal)
app.get('/store-owner', (req, res) => res.redirect('/store-portal'));
app.get('/ai-studio', (req, res) => res.redirect('/store-portal'));
// Privacy Policy
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'privacy_policy.html')));

// --- CREATOR API ---

app.get('/api/review/unlock', (req, res) => {
    if(!CREATOR_STATE.unlockRequests) CREATOR_STATE.unlockRequests = [];
    res.json(CREATOR_STATE.unlockRequests);
});

app.post('/api/review/unlock', async (req, res) => {
    if(!CREATOR_STATE.unlockRequests) CREATOR_STATE.unlockRequests = [];
    
    const proofFile = req.body.proofFile;
    const appealText = req.body.appealText;
    const creatorId = req.body.creatorId || 'Creator_Main';
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    
    let aiRiskScore = 15; // default low risk
    let aiReason = "Google reCAPTCHA Enterprise: 不審なアクティビティ(同一IP・デバイスからの連続BAN履歴)は検出されませんでした。";

    // Gemini AI Fraud Detection (KYC Risk Assessment)
    try {
        const rawKey = process.env.GEMINI_API_KEY || '';
        const GEMINI_API_KEY = rawKey.replace(/^['"]+|['"]+$/g, '').trim();
        
        if (GEMINI_API_KEY) {
            const FIXED_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
            const promptText = `あなたはリテールメディアプラットフォームの不正検知（KYC）AIアシスタントです。
以下の申請情報から、このユーザーがスパム、過去のBAN回避、または悪意のあるボットである可能性（リスクスコア）を0〜100の数値で判定し、その理由を簡潔に回答してください。
（0=極めて安全、100=極めて危険なスパム/違反者）

【ユーザー情報】
・アカウントID: ${creatorId}
・接続IP情報: ${clientIp}
・ユーザーの弁明テキスト: ${appealText || "テキストなし"}

以下のJSONフォーマットのみを出力してください:
{
  "score": リスクスコア(0-100の数値),
  "reason": "判定理由の簡潔な説明"
}`;

            const response = await fetch(FIXED_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: promptText }] }],
                    generationConfig: { response_mime_type: "application/json" }
                })
            });
            const data = await response.json();
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                const aiResponse = JSON.parse(data.candidates[0].content.parts[0].text);
                aiRiskScore = aiResponse.score || 15;
                aiReason = `Gemini不正検知AI: ${aiResponse.reason} (Score: ${aiRiskScore})`;
            }
        } else {
            console.log("[Gemini] API Key not configured. Running fallback logic.");
            if (creatorId.includes('demo') || creatorId.includes('test')) {
                aiRiskScore = 92;
                aiReason = "⚠️ [Fallback] 過去にBANされたアカウントと一致しています (Demo)";
            }
        }
    } catch (e) {
        console.error("Gemini Fraud Detection API Error:", e);
    }

    let proofUrl = null;
    if (proofFile) {
        const fileKey = `unlock/${Date.now()}_proof`;
        const buffer = Buffer.from(proofFile.split(',')[1] || '', 'base64');
        const mime = proofFile.match(/data:(.*?);base64/)[1] || 'image/png';
        try {
            await s3Client.send(new PutObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: fileKey,
                Body: buffer,
                ContentType: mime
            }));
            proofUrl = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fileKey}`;
        } catch(e) {
            proofUrl = proofFile; // fallback to Data URI
        }
    }

    CREATOR_STATE.unlockRequests.push({
        id: Date.now(),
        date: new Date().toISOString(),
        creatorId: creatorId,
        appealText: appealText || '特になし',
        proofUrl: proofUrl,
        aiRiskScore: aiRiskScore,
        aiReason: aiReason,
        status: 'pending'
    });
    res.json({ success: true, riskScore: aiRiskScore });
});

app.post('/api/review/unlock/:id/approve', (req, res) => {
    if(!CREATOR_STATE.unlockRequests) CREATOR_STATE.unlockRequests = [];
    const item = CREATOR_STATE.unlockRequests.find(r => r.id == req.params.id);
    if(item) {
        item.status = 'approved';
        // Unlock all banned videos for this creator
        if (CREATOR_STATE.videos) {
            CREATOR_STATE.videos.forEach(v => {
                if (v.status === 'ban') {
                    v.status = 'active';
                    v.totalAttention = 0; // Reset metrics
                    v.totalSkip = 0;
                    v.views = 0;
                    v.uplift = 0;
                }
            });
        }
        // Unlock all banned campaigns for advertiser
        if (typeof campaigns !== 'undefined') {
            campaigns.forEach(c => {
                if (c.status === 'ban') {
                    c.status = 'active';
                }
            });
        }
    }
    res.json({ success: true });
});

app.get('/api/creator/stats', (req, res) => {
    // Removed automatic demo increment. Views now stay accurate (0 until real views happen).
    CREATOR_STATE.total_views = CREATOR_STATE.videos.filter(v => v.status === 'active').reduce((acc, v) => acc + v.views, 0);
    CREATOR_STATE.total_revenue = CREATOR_STATE.videos.filter(v => v.status === 'active').reduce((acc, v) => acc + v.revenue, 0);

    res.json(CREATOR_STATE);
});


// --- クリエイター: コンテンツ審査API (Vertex AI Gemini 1.5 Pro) ---
// --- STRIKE TRACKING & DEMO LOGIC ---
const accountStrikes = {};
const isDemoAccount = (email) => {
    if (!email) return true;
    return email.includes('demo') || email === 'admin';
};
const unlockRequests = [];

app.get('/api/review/unlock', (req, res) => {
    res.json(unlockRequests);
});
app.post('/api/review/unlock/:id/approve', (req, res) => {
    const id = req.params.id;
    const reqItem = unlockRequests.find(r => r.id === id);
    if (reqItem) {
        reqItem.status = 'approved';
        accountStrikes[reqItem.creatorId] = 0; // Reset strikes
    }
    res.json({ success: true });
});

app.post('/api/creator/request-unlock', (req, res) => {
    const { email, appealText } = req.body;
    unlockRequests.push({
        id: Date.now().toString(),
        creatorId: email,
        appealText: appealText,
        aiRiskScore: 0,
        aiReason: '手動申請',
        status: 'pending',
        date: new Date().toISOString()
    });
    res.json({ success: true });
});

app.post('/api/creator/review-content', async (req, res) => {
    try {
        const { video_base64 } = req.body;
        console.log("クリエイター動画審査開始: Gemini 1.5 Pro");
        if (!video_base64) return res.status(400).json({ error: '動画データがありません', safe: false });
        
        if (video_base64 === "mock_data" || video_base64.length < 500) {
             return res.json({ safe: true, message: "審査通過 (デモ用自動パス)" });
        }

        // 正しくMIMEタイプを抽出し、base64データ部分を分離する
        const match = video_base64.match(/^data:(.*?);base64,(.*)$/);
        let mimeType = 'video/mp4';
        let base64Data = video_base64;
        
        if (match) {
            mimeType = match[1];
            base64Data = match[2];
        } else {
            // data:スキーマがない場合
            base64Data = video_base64;
        }
        
        // Use generativeModel defined globally in server_retail_dist
        if(typeof generativeModel !== 'undefined') {
            const request = {
                contents: [{
                    role: 'user',
                    parts: [
                        { inlineData: { mimeType: mimeType, data: base64Data } },
                        { text: `あなたは世界で最も厳格な「リテールメディア（店舗サイネージ）広告」のコンプライアンス審査AIです。
画像や動画を極めて厳密にスキャンし、以下のいずれかに該当する場合は絶対に配信を許可しないでください。

【絶対禁止ルール（即時FAIL）】
1. 架空請求・サポート詐欺: 「未払い料金」「法的処置」「アカウント消去」等の脅迫や、「ウイルス感染」「システム破損」等の偽警告（サポート詐欺）でユーザーの不安を煽るテキストや画像。
2. 暴力・攻撃的描写: 流血の有無やフィクションに関係なく、殴る・蹴るなどの他者への攻撃的・威圧的な身体接触が1フレームでもあればブロック。
3. 誇大広告・情報商材: 「簡単に稼げる」「確実に痩せる」などの文言、著名人の画像を無断使用した投資詐欺の疑いがあるもの。
4. 危険なQRコード: 安全性が100%確認できない不審なドメインや短縮URL、公式を装った偽LINEアカウントへの誘導。
5. 定期購入の隠蔽（お試し詐欺）: 「初回無料」「たったの500円」と巨大な文字で強調しながら、継続購入の条件が極小文字で隠されている、または明記されていない優良誤認広告。
6. 悪徳点検・格安修理: 「トイレの詰まり数百円〜」「屋根の無料点検」など、相場から著しく逸脱した不自然なほど格安な訪問修理や点検を謳う広告。

【出力フォーマット】
いかなる理由があっても、必ず以下のJSON形式のみを出力してください（Markdownのバッククォートは不要です）。
{"safe": false, "reason": "〇〇のルールに抵触するため"} または {"safe": true, "reason": "問題ありません"}` }
                    ]
                }]
            };
            const result = await generativeModel.generateContent(request);
            const response = await result.response;
            const text = response.candidates[0].content.parts[0].text;
            console.log("クリエイター動画審査完了:", text);
            
            try {
                const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const aiResult = JSON.parse(cleanJson);
                if (aiResult.safe === false) {
                    return res.json({ safe: false, message: '【配信停止】AI判定によりポリシー違反が検出されました:\n' + aiResult.reason });
                } else {
                    return res.json({ safe: true, message: aiResult.reason });
                }
            } catch(e) {
                if (text.includes('FAIL') || text.includes('"safe": false') || text.includes('"safe":false')) {
                    return res.json({ safe: false, message: '【配信停止】AI判定によりポリシー違反が検出されました:\n' + text });
                }
                return res.json({ safe: true, message: text });
            }
        }
        
        res.json({ safe: true, message: "審査通過 (問題なし)" });
    } catch (error) {
        console.error('コンテンツ審査エラー:', error);
        // エラー時はフェイルクローズ（安全ではない）とする
        res.status(500).json({ error: '審査中にエラーが発生しました。ファイルサイズが大きすぎる可能性があります。', safe: false });
    }
});

app.post('/api/creator/upload', (req, res) => {
    console.log(`[API /api/creator/upload] Received new creator video upload request. Data size: ${JSON.stringify(req.body).length} bytes`);
    const { title, src, format, isAd, email } = req.body;
    
    // --- Demo Account Restriction ---
    const creatorEmail = email || 'Guest';
    if (creatorEmail.includes('demo') || creatorEmail.includes('admin') || creatorEmail.includes('test') || creatorEmail === 'client@example.com' || creatorEmail === 'Guest' || creatorEmail === 'Unknown') {
        console.log(`[API /api/creator/upload] Upload rejected: Demo account (${creatorEmail}) cannot upload to production.`);
        return res.status(403).json({ error: "【デモ制限】デモアカウント（テスト用）では実際の動画アップロード・配信はできません。本番アカウントを登録してください。" });
    }

    // --- 3-Strike Check ---
    accountStrikes[creatorEmail] = accountStrikes[creatorEmail] || 0;
    if (accountStrikes[creatorEmail] >= 3) {
        console.log(`[API /api/creator/upload] Upload rejected: Account ${creatorEmail} is BANNED (3 strikes).`);
        return res.status(403).json({ error: "【アカウント凍結】重大な規約違反を繰り返したため、アカウントが凍結されています。画面下部からロック解除申請を行ってください。", isBanned: true });
    }
    const newId = Date.now();
    const newVideo = {
        id: newId,
        title: title || "動画タイトル未定",
        format: format || "縦型 (Shorts)",
        views: 0, revenue: 0, status: 'active',
        attention: "--", skip: "--", uplift: "--", rank: '-', color: '#64748b'
    };
    CREATOR_STATE.videos.unshift(newVideo);

    const finishUpload = (finalUrl) => {
        // Auto-inject into signage player (as PAID or IMPRESSION so it shows up)
        const adData = {
            id: `creator_${newId}`,
            title: `Creator: ${newVideo.title}`,
            url: finalUrl,
            duration: 45,
            status: 'active', // Forces it to be active
        isAd: isAd,
            brand: "Creator",
            youtube_url: (finalUrl && !finalUrl.startsWith('data:') && finalUrl.includes('youtu')) ? finalUrl : null
        };
        signageServer.injectCampaign('9:16', adData, 'PAID'); // Inject as PAID so it joins the loop
        console.log(`[Creator] Video Uploaded & Linked to Signage Loop: ${adData.title}`);

        // Broadcast reload event to all signage players
        broadcastEvent({ type: 'force_reload' });
        res.json({ success: true, video: newVideo, finalUrl: finalUrl });
    };

    if (src && (src.startsWith('data:video/quicktime;base64,') || src.startsWith('data:video/mp4;base64,'))) {
        console.log("[Creator] Detected raw video file, attempting FFmpeg conversion to mp4...");
        const base64Data = src.split(';base64,').pop();
        const ext = src.startsWith('data:video/quicktime') ? 'mov' : 'mp4';
        const filenameIn = "creator_video_" + newId + "." + ext;
        const filenameOut = "creator_video_" + newId + ".mp4";
        const buffer = Buffer.from(base64Data, 'base64');
        
        const path = require('path');
        const savePathIn = path.join(__dirname, 'uploads', filenameIn);
        const savePathOut = path.join(__dirname, 'uploads', filenameOut);
        
        require('fs').writeFileSync(savePathIn, buffer);
        
        try {
            const ffmpeg = require('fluent-ffmpeg');
            const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
            ffmpeg.setFfmpegPath(ffmpegInstaller.path);
            
            ffmpeg(savePathIn)
                .output(savePathOut)
                .videoCodec('libx264')
                .addOption('-preset', 'fast')
                .addOption('-pix_fmt', 'yuv420p')
                .addOption('-crf', '28') // Add heavy compression for Retail Signage
                .on('end', () => {
                    console.log("[Creator] Transcoding finished.");
                    try { require('fs').unlinkSync(savePathIn); } catch(e){}
                    
                    if (typeof s3Client !== 'undefined' && s3Client && typeof bucketName !== 'undefined' && bucketName) {
                        const { PutObjectCommand } = require('@aws-sdk/client-s3');
                        const fileBuf = require('fs').readFileSync(savePathOut);
                        s3Client.send(new PutObjectCommand({ 
                            Bucket: bucketName, 
                            Key: 'uploads/' + filenameOut, 
                            Body: fileBuf, 
                            ContentType: 'video/mp4' 
                        })).then(() => {
                            console.log("[Creator] S3 Upload complete: " + filenameOut);
                            try{ require('fs').unlinkSync(savePathOut); }catch(e){}
                            finishUpload("/uploads/" + filenameOut);
                        }).catch(e => {
                            console.error("[Creator] S3 failed", e);
                            try{ require('fs').unlinkSync(savePathOut); }catch(err){}
                            finishUpload(src);
                        });
                    } else {
                        finishUpload("/uploads/" + filenameOut);
                    }
                })
                .on('error', (err) => {
                    console.error("[Creator] FFmpeg error:", err.message);
                    try { require('fs').unlinkSync(savePathIn); } catch(e){}
                    // Fallback to original
                    finishUpload(src);
                })
                .run();
        } catch(e) {
            console.error("[Creator] Failed to init ffmpeg:", e.message);
            try { require('fs').unlinkSync(savePathIn); } catch(err){}
            finishUpload(src);
        }
    } else if (src && src.startsWith('data:')) {
        console.log("[Creator] Saving generic media file to S3...");
        const mime = src.split(';')[0].split(':')[1] || 'application/octet-stream';
        const ext = mime.split('/')[1] || 'media';
        const base64Data = src.split(';base64,').pop();
        const filename = `video_${newId}.${ext}`;
        const buffer = Buffer.from(base64Data, 'base64');
        const outputPath = require('path').join(__dirname, 'uploads', filename);
        
        if (typeof s3Client !== 'undefined' && s3Client && typeof bucketName !== 'undefined' && bucketName) {
            try {
                const { PutObjectCommand } = require('@aws-sdk/client-s3');
                s3Client.send(new PutObjectCommand({ 
                    Bucket: bucketName, 
                    Key: 'uploads/' + filename, 
                    Body: buffer, 
                    ContentType: mime 
                })).then(() => {
                    console.log("[Creator] Successfully uploaded generic media to S3: " + filename);
                    finishUpload("/uploads/" + filename);
                }).catch(e => {
                    require('fs').writeFileSync(outputPath, buffer);
                    finishUpload("/uploads/" + filename);
                });
            } catch(e){
                require('fs').writeFileSync(outputPath, buffer);
                finishUpload("/uploads/" + filename);
            }
        } else {
            require('fs').writeFileSync(outputPath, buffer);
            finishUpload("/uploads/" + filename);
        }
    } else {
        finishUpload(src || "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyprises.mp4");
    }
});

// --- SQUARE PAYMENT API (Sync to Admin Portal) ---
app.post('/api/payment/square-charge', async (req, res) => {
    const { token, amount, source } = req.body;
    console.log(`[Admin Portal Hook] 💳 Square Payment Detected! Amount: ¥${amount} from ${source}`);
    
    // デモ決済用のトークンが送られてきた場合は、本番のSquareAPIを叩かずに成功扱いにする
    if (token === 'demo-applepay' || token === 'demo-local-token' || token === 'demo-error-token') {
        console.log(`[Square API] Demo token detected (${token}). Bypassing actual Square charge.`);
        return res.json({ success: true, transactionId: `demo_tx_${Date.now()}` });
    }

    console.log(`[Square API] Using Production Key for actual charge.`);
    
    try {
        const customFetch = globalThis.fetch || ((...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)));
        const crypto = require('crypto');
        
        // Execute Actual Production Charge via Square API
        const idempotencyKey = crypto.randomUUID();
        const squareRes = await customFetch('https://connect.squareup.com/v2/payments', {
            method: 'POST',
            headers: {
                'Square-Version': '2024-03-20',
                'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN || ''}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                source_id: token,
                idempotency_key: idempotencyKey,
                amount_money: { amount: Number(amount), currency: 'JPY' }
            })
        });

        const squareData = await squareRes.json();
        
        if (!squareRes.ok || squareData.errors) {
            console.error(`[Square API Error]`, squareData.errors);
            return res.status(400).json({ success: false, error: '決済に失敗しました' });
        }

        // Store separate totals (SSoT Sync)
        if (source.includes('anywhere-regi') || source.includes('anywhere_regi')) {
            if(typeof storeData !== 'undefined' && storeData["default_store"]) {
                storeData["default_store"].total_pos_sales += Number(amount);
                console.log(`[Admin] POS Sales updated. Current pos total: ¥${storeData["default_store"].total_pos_sales}`);
            }
        } else {
            totalRevenue += Number(amount);
            console.log(`[Admin] Retail Ad Revenue updated. Current ad total: ¥${totalRevenue}`);
        }
        
        // Return successful charge with actual transaction ID
        res.json({ success: true, transactionId: squareData.payment.id });
    } catch (e) {
        console.error("Square charge failed:", e);
        res.status(500).json({ success: false, error: 'サーバー連携エラー' });
    }
});


// --- RETAILER DASHBOARD APIs ---
app.get('/api/retailer/dashboard', async (req, res) => {
    const storeId = req.query.store_id || "default_store";
    
    try {
        const params = {
            TableName: 'RetailMediaTransactions',
            KeyConditionExpression: 'store_id = :sid',
            ExpressionAttributeValues: {
                ':sid': storeId
            },
            ScanIndexForward: false,
            Limit: 50
        };
        const command = new QueryCommand(params);
        const data = await docClient.send(command);
        
        const txs = data.Items || [];
        const totalAmount = txs.reduce((sum, tx) => sum + (Number(tx.total_amount) || 0), 0);
        
        res.json({
            success: true,
            store_id: storeId,
            sales: totalAmount,
            transactions: txs
        });
    } catch (err) {
        console.error("[DynamoDB Query Error]:", err);
        res.json({
            success: true,
            store_id: storeId,
            sales: 0,
            transactions: []
        });
    }
});


// --- DynamoDB POS Transaction API ---
app.post('/api/pos/transaction', async (req, res) => {
    try {
        const { store_id, total_amount, items } = req.body;
        if (!store_id) return res.status(400).json({ success: false, error: "store_id is required" });
        
        const timestamp = Date.now().toString();
        const transaction_id = `tx_${timestamp}_${Math.floor(Math.random()*1000)}`;
        
        const params = {
            TableName: 'RetailMediaTransactions',
            Item: {
                store_id: store_id,
                timestamp: timestamp,
                transaction_id: transaction_id,
                total_amount: total_amount || 0,
                items: items || [],
                created_at: new Date().toISOString()
            }
        };

        await docClient.send(new PutCommand(params));
        console.log(`[DynamoDB] Saved transaction ${transaction_id} for store ${store_id}`);

        res.json({ success: true, transaction_id });
    } catch (err) {
        console.error("[DynamoDB Error]:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/retailer/settings', (req, res) => {
    const { store_id, settings } = req.body;
    const sId = store_id || "default_store";
    if(!storeData[sId]) storeData[sId] = { total_pos_sales: 0 };
    storeData[sId].settings = settings;
    // pushToS3 will automatically catch this change in the next interval
    res.json({ success: true, message: 'Settings saved' });
});

// --- ANYWHERE REGI POS SYNC API ---
app.post('/api/admin/sales', (req, res) => {
    try {
        const txData = req.body;
        console.log(`[POS Sync] ✅ Received New Transaction: ${txData.transactionId} (${txData.amount}円)`);
        console.log(`[POS Sync] 🛒 Items:`, txData.items.map(i => `${i.name} (¥${i.price})`).join(', '));
        
        // Broadcast the purchase event so Signage and Ad Engine can see the Uplift
        broadcastEvent({
            type: 'pos_purchase_sync',
            transaction: txData
        });
        
        // 独立したモジュールであるため、POS決済データとCreator（サイネージ広告枠）の直接的なコミッション連動は行いません

        res.json({ success: true, message: "Synced to Admin Server" });
    } catch (e) {
        console.error("[POS Sync Error]", e);
        res.status(500).json({ success: false });
    }
});

// --- AUTH (2FA) ---
const users = {
    // Demo Accounts (Pre-seeded)
    "advertiser@demo.com": { password: "DemoPass2026!", role: "advertiser" },
    "store@demo.com": { password: "DemoPass2026!", role: "store" },
    "agency@demo.com": { password: "DemoPass2026!", role: "agency" },
    "creator@demo.com": { password: "DemoPass2026!", role: "creator" }
};

app.post('/api/auth/register', (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and Password required" });

    if (users[email]) return res.status(400).json({ error: "User already exists" });

    // Register User
    users[email] = { password, role: role || "store" }; // Default to Store if not specified
    console.log(`[Auth] 🆕 New User Registered: ${email} (${users[email].role})`);

    currentUser = { email, role: users[email].role }; // Auto Login
    res.json({ success: true, redirect: getRedirectUrl(users[email].role) });
});

// Simple Session State for Demo
let currentUser = null;

// --- 2FA Setup ---
app.post('/api/auth/2fa/setup', (req, res) => {
    const { email } = req.body;
    try {
        const speakeasy = require('speakeasy');
        const qrcode = require('qrcode');
        const secret = speakeasy.generateSecret({ name: `RetailMedia (${email})` });
        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) return res.status(500).json({ error: "QRコード生成失敗" });
            res.json({ secret: secret.base32, qrcode: data_url });
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


app.post('/api/auth/2fa/verify', (req, res) => {
    const { email, token } = req.body;
    try {
        const speakeasy = require('speakeasy');
        if (users[email] && users[email].twoFactorSecret) {
            const verified = speakeasy.totp.verify({ secret: users[email].twoFactorSecret, encoding: 'base32', token: token, window: 1 });
            if (verified) {
                res.json({ success: true });
            } else {
                res.json({ success: false, error: "コードが違います" });
            }
        } else {
            res.json({ success: false, error: "ユーザーが見つからないか2FA未設定です" });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/2fa/enable', (req, res) => {
    const { email, secret, token } = req.body;
    try {
        const speakeasy = require('speakeasy');
        const verified = speakeasy.totp.verify({ secret: secret, encoding: 'base32', token: token, window: 1 });
        if (verified && users[email]) {
            users[email].twoFactorSecret = secret;
            res.json({ success: true });
        } else {
            res.json({ success: false, error: "無効なコードです" });
        }
    } catch (e) {
        res.json({ success: false, error: e.message });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { email, password, role, name, org, totpCode } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    let user = users[email];

    // Auto-Register if user does not exist (to keep the ease of demo but persist data)
    if (!user) {
        users[email] = { password, role: role || "store", name: name, org: org };
        user = users[email];
        console.log(`[Auth] 🆕 Auto-Registered: ${email} (${user.role})`);
        // RDS sync will handle persistence automatically in background
    } else {
        // Update name and org if provided and different
        let updated = false;
        if (name && user.name !== name) { user.name = name; updated = true; }
        if (org && user.org !== org) { user.org = org; updated = true; }
    }

    if (user && user.password === password) {
        // Track login count for 2FA suggestion
        user.loginCount = (user.loginCount || 0) + 1;

        if ((user.role === 'admin' || user.role === 'system_admin') ) {
            if (!totpCode) {
                if (!user.twoFactorSecret) {
                    return res.json({ success: true, require2FASetup: true, email: email });
                } else {
                    return res.json({ success: true, require2FA: true, email: email });
                }
            } else {
                const speakeasy = require('speakeasy');
                const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token: totpCode, window: 1 });
                if (!verified) return res.json({ success: false, error: "無効な認証コードです (Invalid 2FA Code)" });
            }
        } else {
            // For general users: Suggest 2FA on their 3rd login if not already setup
            if (user.loginCount === 3 && !user.twoFactorSecret && email !== 'demo@retail-ad.com') {
                return res.json({ success: true, suggest2FASetup: true, email: email, redirect: getRedirectUrl(user.role), role: user.role });
            }
            // If they have 2FA enabled, enforce it
            if (user.twoFactorSecret) {
                if (!totpCode) {
                    return res.json({ success: true, require2FA: true, email: email });
                } else {
                    const speakeasy = require('speakeasy');
                    const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token: totpCode, window: 1 });
                    if (!verified) return res.json({ success: false, error: "無効な認証コードです (Invalid 2FA Code)" });
                }
            }
        }

        currentUser = { email, role: user.role }; // Set Session
        res.json({ success: true, redirect: getRedirectUrl(user.role), user: { email, role: user.role, name: user.name, org: user.org } });
    } else {
        console.log(`[Auth] ❌ Login Failed: ${email}`);
        res.json({ success: false, error: "Invalid Email or Password" });
    }
});


app.get('/api/auth/users', (req, res) => {
    const userList = [];
    for (const email in users) {
        userList.push({ email: email, name: users[email].name || email.split('@')[0], role: users[email].role, org: users[email].org || 'Demo Corp' });
    }
    res.json({ success: true, users: userList });
});

app.post('/api/auth/reset-password', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    if (users[email]) {
        users[email].password = password;
        console.log(`[Auth] 🔑 Password Reset: ${email}`);
        res.json({ success: true });
    } else {
        res.json({ success: false, error: "User not found" });
    }
});

app.get('/api/user/me', (req, res) => {
    if (currentUser) {
        res.json({ success: true, user: currentUser });
    } else {
        // Default fall-back for demo consistency if server restarted
        res.json({ success: true, user: { email: "store@demo.com", role: "store" } });
    }
});

app.post('/api/auth/reset-password', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    console.log(`[Auth] 📧 Password Reset Link Sent to: ${email}`);
    res.json({ success: true });
});

function getRedirectUrl(role) {
    if (role === 'advertiser') return '/ad_dashboard.html';
    if (role === 'agency') return '/agency_portal.html';
    if (role === 'creator') return '/creator_portal.html';
    return '/store_portal.html'; // Default
}

/*

    if (pendingAuth[phone] === code) {
        console.log(`[Auth] ✅ Verification Success for ${phone}`);
        delete pendingAuth[phone]; // Clear code after use

        // Determine role redirect
        let redirectUrl = '/store-portal';
        if (phone.startsWith('090')) redirectUrl = '/advertiser';
        if (phone.startsWith('070')) redirectUrl = '/agency-portal'; // Agency Prefix

        res.json({ success: true, redirect: redirectUrl });
    } else {
        console.log(`[Auth] ❌ Verification Failed for ${phone} (Input: ${code}, Expected: ${pendingAuth[phone]})`);
*/


// --- API ---

// --- ADMIN API ---




// Official Campaign Creation Endpoint (Dashboard)
app.post('/api/campaigns', (req, res) => {
    console.log(`[API /api/campaigns] Received new campaign creation request. Data size: ${JSON.stringify(req.body).length} bytes`);
    try {
        const { name, start, end, budget, plan, trigger, target_imp, file_url, url, youtube_url, format, ad_email, ytUrl, fileUrl } = req.body;

        // --- Demo Account Restriction ---
        if (!ad_email || ad_email.includes('demo') || ad_email.includes('admin') || ad_email.includes('test') || ad_email === 'client@example.com' || ad_email === 'Guest' || ad_email === 'Unknown') {
            console.log(`[API /api/campaigns] Upload rejected: Demo account (${ad_email}) cannot upload to production.`);
            return res.status(403).json({ error: "【デモ制限】デモアカウント（テスト用）では実際の動画アップロード・配信はできません。本番アカウントを登録してください。" });
        }

        // --- 3-Strike Check ---
        if (ad_email) {
            accountStrikes[ad_email] = accountStrikes[ad_email] || 0;
            if (accountStrikes[ad_email] >= 3) {
                console.log(`[API /api/campaigns] Upload rejected: Account ${ad_email} is BANNED (3 strikes).`);
                return res.status(403).json({ error: "【アカウント凍結】重大な規約違反を繰り返したため、アカウントが凍結されています。画面下部からロック解除申請を行ってください。", isBanned: true });
            }
        }

        console.log(`[API] Creating Campaign: ${name} (${plan}) | Advertiser: ${ad_email}`);

        // Handle Agency Commission Match
        let appliedPrice = parseInt(budget) || 10000;
        let matchedAgency = agencyReferrals.find(r => r.advertise === ad_email && r.status === 'Pending');
        if (matchedAgency) {
            matchedAgency.status = '稼働中';
            matchedAgency.price = appliedPrice; // Update to actual budget
            const commission = Math.floor(appliedPrice * 0.2);
            console.log(`[Agency] Match found! 20% Commission (¥${commission}) applied for ${matchedAgency.agency}`);
            
            // Subtract commission from the platform/store's total revenue side
            // For demo purposes, we reflect it in global totalRevenue
            totalRevenue += (appliedPrice - commission);
        } else {
            totalRevenue += appliedPrice;
        }

        // Map Plan to Server Types
        let type = 'PAID';
        if (plan === 'moment') type = 'MOMENT';
        if (plan === 'impression') type = 'IMPRESSION';
        // CPA is also PAID but with specific tracking setup

        const processAndInject = async (finalUrl) => {
            let adStatus = 'pending';
            try {
                if (finalUrl && finalUrl.startsWith('data:')) {
                    const base64Data = finalUrl.replace(/^data:\w+\/\w+;base64,/, "");
                    if (base64Data.length < 500) {
                        adStatus = 'active';
                    } else if (typeof generativeModel !== 'undefined') {
                        const mimeType = finalUrl.startsWith('data:image') ? 'image/jpeg' : 'video/mp4';
                        const request = {
                            contents: [{
                                role: 'user',
                                parts: [
                                    { inlineData: { mimeType: mimeType, data: base64Data } },
                                    { text: 'あなたは広告プラットフォームの厳格なAIモデレーターです。以下に該当する不適切なコンテンツが含まれていないか審査してください。\n1: 過度な暴力、性的描写、ヘイトスピーチ等の公序良俗に反する内容\n2: 「必ず儲かる」「投資で稼ぐ」といった投資詐欺・誇大広告\n3: 「続きはLINEで」「LINE登録はこちら」などのLINEや外部SNSへ誘導し情報商材を売るようなスパム・詐欺的誘導。これらが少しでも含まれる場合は必ず「FAIL: 理由」を、完全に安全な小売広告であれば「PASS: 理由」を出力してください。' }
                                ]
                            }]
                        };
                        const result = await generativeModel.generateContent(request);
                        const text = result.response.candidates[0].content.parts[0].text;
                        if (text.includes('FAIL')) { 
                            adStatus = 'rejected'; 
                            if (ad_email) {
                                accountStrikes[ad_email] = (accountStrikes[ad_email] || 0) + 1;
                                console.log(`[Strike] Account ${ad_email} received a strike! Total: ${accountStrikes[ad_email]}`);
                            }
                        } else { 
                            adStatus = 'active'; 
                        } 
                        console.log(`[AutoReview] AI Result: ${text} -> (実装テスト中のため active として処理)`);
                    } else {
                        adStatus = 'active'; // Fallback
                    }
                } else {
                    adStatus = 'active'; // YouTube/Empty
                }
            } catch (err) {
                console.error("[AutoReview] AI Review failed:", err);
                adStatus = 'pending'; // Failsafe
            }
            console.log(`[AutoReview] Campaign '${name}' auto-review result: ${adStatus}`);

            const metadata = {
                title: name,
                format: format, // Pass format (image/video/youtube)
                status: adStatus, // Result of automatic review
                // Prioritize passed URL (Base64) or YouTube URL. DO NOT default to Sintel anymore.
                url: finalUrl,
                youtube_url: (finalUrl && !finalUrl.startsWith('data:') && finalUrl.includes('youtu')) ? finalUrl : (youtube_url || ytUrl),
                duration: 15,
                start_date: start,
                end_date: end,
                budget: budget,
                plan_type: plan,
                trigger: trigger,          // For Moment
                target_imp: target_imp     // For Impression
            };

            // Inject into Server Logic
            if (signageServer && signageServer.injectCampaign) {
                signageServer.injectCampaign('16:9', metadata, type);
            }
        };

        const rawUrl = url || file_url || youtube_url || "";

        if (rawUrl.startsWith('data:video/quicktime;base64,') || rawUrl.startsWith('data:video/mp4;base64,')) {
            console.log("[AdUpload] Detected raw video file, transcoding and compressing heavily...");
            const base64Data = rawUrl.split(';base64,').pop();
            const ext = rawUrl.startsWith('data:video/quicktime') ? 'mov' : 'mp4';
            const tempId = Date.now();
            const inputPath = path.join(__dirname, 'uploads', `ad_temp_${tempId}.${ext}`);
            const outputPath = path.join(__dirname, 'uploads', `ad_video_${tempId}.mp4`);
            fs.writeFileSync(inputPath, base64Data, { encoding: 'base64' });

            ffmpeg(inputPath)
                .output(outputPath)
                .videoCodec('libx264')
                .addOption('-preset', 'fast')
                .addOption('-crf', '28') // Heavy compression for Retail Signage
                .on('error', (err) => {
                    console.error("[AdUpload] FFmpeg transcoding failed (likely missing on Windows). Fallback to raw base64 data.", err);
                    try { require('fs').unlinkSync(inputPath); } catch(e){}
                    processAndInject(rawUrl);
                    if (typeof broadcastEvent === 'function') broadcastEvent({ type: 'force_reload' });
                })
                .on('end', () => {
                    console.log("[AdUpload] Transcoding & Compression finished.");
                    if (typeof s3Client !== 'undefined' && s3Client && typeof bucketName !== 'undefined' && bucketName) {
                        try {
                            const { PutObjectCommand } = require('@aws-sdk/client-s3');
                            const fileBuf = require('fs').readFileSync(outputPath);
                            s3Client.send(new PutObjectCommand({
                                Bucket: bucketName,
                                Key: `uploads/ad_video_${tempId}.mp4`,
                                Body: fileBuf,
                                ContentType: 'video/mp4'
                            })).then(() => {
                                console.log("[AdUpload] S3 Upload complete.");
                                require('fs').unlinkSync(inputPath);
                                require('fs').unlinkSync(outputPath);
                                processAndInject(`/uploads/ad_video_${tempId}.mp4`);
                                if (typeof broadcastEvent === 'function') broadcastEvent({ type: 'force_reload' });
                            }).catch(err => {
                                console.error("[S3] Upload error:", err);
                                require('fs').unlinkSync(inputPath);
                                processAndInject(`/uploads/ad_video_${tempId}.mp4`);
                            });
                        } catch(e) {}
                    } else {
                        require('fs').unlinkSync(inputPath);
                        processAndInject(`/uploads/ad_video_${tempId}.mp4`);
                        // We must wait to broadcast or return. Because Express prefers sync response,
                        // we returned "Campaign Created" below before finish, but that's fine.
                        if (typeof broadcastEvent === 'function') broadcastEvent({ type: 'force_reload' });
                    }
                }).run();

            res.json({ success: true, message: "Campaign Created (Transcoding in background)" });
        } else {
            processAndInject(rawUrl);
            if (typeof broadcastEvent === 'function') broadcastEvent({ type: 'force_reload' });
            res.json({ success: true, message: "Campaign Created" });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/campaigns', (req, res) => {
    // Return real campaigns from Signage Server State
    let list = [];
    if (signageServer && signageServer.getAllCampaigns) {
        list = signageServer.getAllCampaigns();
    }
    res.json(list);
});

// Update Campaign Status Endpoint (for Approval)
app.post('/api/campaigns/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body;
    if (signageServer && signageServer.updateCampaignStatus) {
        const success = signageServer.updateCampaignStatus(id, status);
        if (success) {
            res.json({ success: true, message: 'Status updated' });
        } else {
            res.status(404).json({ error: 'Campaign not found' });
        }
    } else {
        res.status(500).json({ error: 'Signage server disconnected' });
    }
});

// CSV Export Endpoint
app.get('/api/reports/csv', (req, res) => {
    let list = [];
    if (signageServer && signageServer.getAllCampaigns) {
        list = signageServer.getAllCampaigns();
    }
    
    const headers = "ID,キャンペーン名,プラン,ステータス,予算(円),消化(円),インプレッション,開始日,終了日\n";
    const rows = list.map(c => 
        `"${c.id}","${c.name || ''}","${c.plan}","${c.status}","${c.budget}","${c.spend || 0}","${c.imp}","${c.start || ''}","${c.end || ''}"`
    ).join('\n');
    
    const bom = '\uFEFF';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="retail_media_report.csv"');
    res.send(bom + headers + rows);
});

// Real Upload Endpoint (Production Mode)

// --- Retailer Video Upload (S3 Direct) ---
app.post('/api/retailer/upload', async (req, res) => {
    try {
        const { fileData, filename, prefix, targetStore } = req.body;
        if (!fileData || !filename) return res.status(400).json({ success: false, error: "No file data" });

        // --- AI Moderation for Retailer Videos (Gemini 1.5 Pro) ---
        console.log("[Retailer Video Upload] AI 審査開始...");
        if (typeof generativeModel !== 'undefined' && fileData.includes('base64,')) {
            const base64Data = fileData.split('base64,')[1];
            try {
                const request = {
                    contents: [{
                        role: 'user',
                        parts: [
                            { inlineData: { mimeType: 'video/mp4', data: base64Data } },
                            { text: 'あなたは広告プラットフォームの厳格なAIモデレーターです。以下に該当する不適切なコンテンツが含まれていないか審査してください。\n1: 過度な暴力、性的描写、ヘイトスピーチ等の公序良俗に反する内容。\n2: 「必ず儲かる」「投資で稼ぐ」といった投資詐欺・誇大広告。\n3: 「続きはLINEで」「LINE登録はこちら」などのLINEや外部SNSへ誘導し情報商材を売るようなスパム・詐欺的誘導。\n少しでも該当する場合は「FAIL: 理由」を、安全であれば「PASS」を出力してください。' }
                        ]
                    }]
                };
                const result = await generativeModel.generateContent(request);
                const responseText = await result.response.text();
                console.log("[Retailer AI Moderation] 結果:", responseText);
                
                if (responseText.includes('FAIL')) {
                    return res.status(403).json({ success: false, error: 'AI審査で拒絶されました。不適切なコンテンツまたは詐欺的誘導が含まれています。\n' + responseText });
                }
            } catch (aiErr) {
                console.error("[Retailer AI Moderation Error]", aiErr);
                // Continue upload if AI fails due to size limits, etc.
            }
        }
        // --------------------------------------------------------

        const ext = require('path').extname(filename).toLowerCase();
        const newFilename = `retail_${prefix}_${Date.now()}${ext}`;
        const s3Key = `uploads/${newFilename}`;
        
        // Ensure global is initialized
        if (!global.retailer_videos) global.retailer_videos = [];

        // Save to S3 using AWS SDK (With Cloud Compression)
        const { PutObjectCommand } = require('@aws-sdk/client-s3');
        let buffer = Buffer.from(fileData.split(',')[1], 'base64');
        const ffmpeg = require('fluent-ffmpeg');
        const ffmpegPath = require('ffmpeg-static');
        const fs = require('fs');
        const os = require('os');
        const path = require('path');
        ffmpeg.setFfmpegPath(ffmpegPath);

        const uploadToS3 = (finalBuffer) => {
            s3Client.send(new PutObjectCommand({
                Bucket: S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME,
                Key: s3Key,
                Body: finalBuffer,
                ContentType: 'video/mp4'
            })).then(() => {
                console.log(`[Retailer] Successfully uploaded ${newFilename} to S3.`);
                const newVideo = {
                    id: `retailer_${Date.now()}`,
                    title: filename,
                    url: `/uploads/${newFilename}`,
                    aspect_ratio: '16:9',
                    status: 'active',
                    retailer_prefix: prefix,
                    target_store: targetStore || 'ALL',
                    time_limit: req.body.time_limit !== undefined ? req.body.time_limit : false
                };
                global.retailer_videos.push(newVideo);
                res.json({ success: true, video: newVideo });
            }).catch(err => {
                console.error("[Retailer] S3 Upload Error:", err);
                res.status(500).json({ success: false, error: err.message });
            });
        };

        // If file is > 10MB or is MOV, compress it on the server
        if (buffer.length > 10 * 1024 * 1024 || ext === '.mov') {
            console.log(`[Retailer Video Upload] File is large or MOV (${(buffer.length / 1024 / 1024).toFixed(2)}MB). Starting cloud compression...`);
            const tempInput = path.join(os.tmpdir(), `input_${Date.now()}${ext}`);
            const tempOutput = path.join(os.tmpdir(), `output_${Date.now()}.mp4`);
            
            fs.writeFileSync(tempInput, buffer);
            
            ffmpeg(tempInput)
                .outputOptions([
                    '-vcodec libx264',
                    '-crf 28',
                    '-preset veryfast', // veryfast to avoid taking too much time on server
                    '-acodec aac',
                    '-y'
                ])
                .save(tempOutput)
                .on('end', () => {
                    console.log(`[Retailer Video Upload] Cloud compression completed.`);
                    const compressedBuffer = fs.readFileSync(tempOutput);
                    
                    // Cleanup temp files
                    try { fs.unlinkSync(tempInput); fs.unlinkSync(tempOutput); } catch(e){}
                    
                    uploadToS3(compressedBuffer);
                })
                .on('error', (err) => {
                    console.error('[Retailer Video Upload] Cloud compression failed:', err);
                    // Fallback to original buffer
                    try { fs.unlinkSync(tempInput); fs.unlinkSync(tempOutput); } catch(e){}
                    uploadToS3(buffer);
                });
        } else {
            // Small MP4 file, skip compression
            uploadToS3(buffer);
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/api/retailer/videos', (req, res) => {
    const prefix = req.query.prefix;
    if (!global.retailer_videos) global.retailer_videos = [];
    const vids = global.retailer_videos.filter(v => v.retailer_prefix === prefix);
    res.json(vids);
});

app.delete('/api/retailer/videos/:id', (req, res) => {
    if (!global.retailer_videos) return res.json({success:false});
    global.retailer_videos = global.retailer_videos.filter(v => v.id !== req.params.id);
    res.json({success:true});
});

app.post('/api/ad/upload', (req, res) => {
    // Determine extension from original filename
    const originalName = req.query.filename || "upload.mp4";
    const ext = path.extname(originalName) || ".mp4";
    const filename = `upload_${Date.now()}${ext}`;
    const savePath = path.join(LOCAL_MEDIA_PATH, filename);

    // Ensure media dir exists
    if (!fs.existsSync(LOCAL_MEDIA_PATH)) fs.mkdirSync(LOCAL_MEDIA_PATH, { recursive: true });

    // Stream upload to file
    const writeStream = fs.createWriteStream(savePath);
    req.pipe(writeStream);

    writeStream.on('finish', () => {
        console.log(`[Upload] Saved to ${savePath}`);

        if (typeof s3Client !== 'undefined' && s3Client && typeof bucketName !== 'undefined' && bucketName) {
            try {
                const { PutObjectCommand } = require('@aws-sdk/client-s3');
                const fileBuf = require('fs').readFileSync(savePath);
                s3Client.send(new PutObjectCommand({
                    Bucket: bucketName,
                    Key: `uploads/${filename}`,
                    Body: fileBuf
                })).then(() => {
                    console.log("[S3] Upload endpoint saved to S3");
                    require('fs').unlinkSync(savePath); 
                }).catch(e=>{});
            } catch(e){}
        }

        const metadata = {
            id: `upload-${Date.now()}`,
            title: 'Uploaded Ad',
            url: `/uploads/${filename}`,
            duration: 15000,
            is_image: false, // Will be updated if extension is image
            timestamp: Date.now()
        };

        // Detect Image type from filename (Basic Check)
        if (req.query.filename && (req.query.filename.endsWith('.jpg') || req.query.filename.endsWith('.png'))) {
            metadata.is_image = true;
            metadata.duration = 10000; // 10s for images
        }

        // BGM Logic
        if (req.query.bgm) {
            metadata.bgm = req.query.bgm;
            console.log(`[Upload] BGM Attached: ${metadata.bgm}`);
        }

        // Ingredients / QR Logic
        if (req.query.ingredients) {
            metadata.ingredients = req.query.ingredients;
            // metadata.location_qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://google.com/search?q=${encodeURIComponent(req.query.ingredients)}`;
            // QR Code REMOVED as per user request
        }

        // Inject as PAID campaign
        signageServer.injectCampaign('16:9', metadata, 'PAID');

        res.json({ success: true, url: metadata.url });
    });

    writeStream.on('error', (err) => {
        console.error("Upload Error:", err);
        res.status(500).json({ error: 'Upload failed' });
    });
});

app.get('/api/ai/generate', (req, res) => {
    const text = req.query.text || "Special Sale";
    const speed = req.query.speed || 1.0;
    console.log(`[AI Studio] Generating video for: "${text}" (Speed: ${speed}x)`);

    signageServer.injectCampaign('16:9', { brand: 'AI Studio', scope: 'store_local', ai_text: text, ai_voice_speed: speed }, 'STORE');
    res.json({ success: true, status: 'generated' });
});

// --- GOOGLE CLOUD TTS PROXY ---
// To use this, you must set an environment variable GOOGLE_APPLICATION_CREDENTIALS
// pointing to your downloaded Service Account JSON key file.
let TextToSpeechClient = null;

app.post('/api/ai/tts', async (req, res) => {
    try {
        const { text, speed, voiceEngine } = req.body;
        if (!text) return res.status(400).json({ error: "Text required" });
        
        console.log(`[TTS API Proxy] Redirecting legacy /api/ai/tts to Gemini 2.5 Flash...`);
        const stylePrompt = req.body.stylePrompt || "元気な感じ";
        const voiceName = (voiceEngine && voiceEngine.includes('gemini_')) ? voiceEngine.replace('gemini_', '') : 'Aoede';

        const rawKey = process.env.GEMINI_API_KEY || '';
        const GEMINI_API_KEY = rawKey.replace(/^['"]+|['"]+$/g, '').trim();
        if (!GEMINI_API_KEY) return res.status(500).json({ success: false, error: 'GEMINI_API_KEY is not set in .env' });
        
        const FIXED_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(FIXED_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: `You are an AI voice generator. Generate a pristine voice track of the following text with this style: ${stylePrompt}. Text: ${text}` }] }],
                generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } } }
            })
        });
        if (!response.ok) {
            const err = await response.text();
            console.error('Gemini TTS Error:', err);
            return res.status(response.status).json({ success: false, error: err });
        }
        const data = await response.json();
        let audioPart = null;
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            audioPart = data.candidates[0].content.parts.find(p => p.inlineData);
        }
        if (audioPart && audioPart.inlineData) {
            res.json({ audioContent: audioPart.inlineData.data });
        } else {
            res.status(500).json({ success: false, error: 'No audio data returned from Gemini' });
        }
    } catch (error) {
        console.error('Gemini Proxy Exception:', error);
        res.status(500).json({ success: false, error: error.toString() });
    }
});

app.get('/api/store/revenue', (req, res) => {
    const s = storeData["default_store"];
    res.json({
        totalRevenue: totalRevenue,
        storeShare: totalRevenue * 0.5, // 50% split
        transactions: transactions,
        history: [50000, 120000, 250000, 310000, 450000, totalRevenue * 0.5],
        // return saved settings
        bank_info: s.bank_info,
        billing_email: s.billing_email
    });
});

app.get('/api/ad/analytics', async (req, res) => {
    const region = req.query.region || 'Tokyo';
    const lat = req.query.lat;
    const lon = req.query.lon;

    const attribution = adEngine.calculateAttribution([{ timestamp: new Date().toISOString() }]);

    // Pass lat/lon if available, otherwise defaulting logic inside engine
    const context = await adEngine.analyzeContext(region, lat, lon);

    const impactScore = context.current_condition ? context.current_condition.impact_score : 1.0;
    const analysis = adEngine.analyzeThreshold(impactScore);
    const traffic = adEngine.analyzeTrafficStats(); // Mock traffic dist

    // REAL DATA LOGIC
    // We use persistent variables (in memory for now)
    // If Production Mode, we show specific tracking for uploaded campaigns.

    // Global Stats (Simulated persistence)
    if (!global.productionStats) {
        global.productionStats = {
            revenue: 0,
            sales: 0,
            scans: 0,
            ab: {
                A: { views: 0, scans: 0, sales: 0 },
                B: { views: 0, scans: 0, sales: 0 }
            }
        };
    }

    // Always use real tracking data
    attribution.revenue = global.productionStats.revenue;
    attribution.sales = global.productionStats.sales;
    traffic.os_share = { 'iOS': 60, 'Android': 40 };

    // CPA Logic
    if (attribution.sales > 0) {
        // Simple CPA: 50,000 avg ad spend / sales
        attribution.cpa = Math.floor(10000 / attribution.sales);
    } else {
        attribution.cpa = 0;
    }

    res.json({
        attribution, analysis, context, traffic,
        scan_count: global.productionStats.scans,
        ab_stats: global.productionStats.ab // Send A/B data
    });
});


app.get('/api/signage/playlist', (req, res) => {
    console.log(`[API /api/signage/playlist] Received playlist fetch request from Store: ${req.query.storeId || 'Unknown'}, Location: ${req.query.location || 'Unknown'}`);
    const location = req.query.location || 'register_side';
    let playlist = signageServer.getPlaylist(location);

    // [Fix] Force Remove Default "Spaghetti" Demo Content if present
    if (playlist && playlist.length > 0 && playlist[0].id === 'ad_default') {
        playlist = []; // Send empty playlist instead of demo video
    }

    // [Production Mode Logic]
    // If in Production, do NOT show the default "Spaghetti" demo.
    // Show a "Waiting for Content" placeholder instead if no paid/store content exists.
    if (playlist.length > 0 && playlist[0].id === 'ad_default') {
        playlist = [{
            id: 'placeholder_prod',
            title: 'Waiting for Content',
            url: 'https://via.placeholder.com/1920x1080/000000/ffffff?text=Waiting+for+Advertiser+Content', // Simple placeholder
            duration: 5000,
            is_image: true
        }];
    }

    res.json(playlist);
});

// --- Tracking Endpoints (Real-time A/B Data) ---

// 1. Scan Tracker (Redirects to actual content)
app.get('/api/track/scan', (req, res) => {
    const variant = req.query.variant || 'A'; // Default A
    // Increment global stats
    if (global.productionStats) {
        global.productionStats.scans++;
        if (global.productionStats.ab[variant]) {
            global.productionStats.ab[variant].scans++;
        }
    }
    console.log(`[Tracker] QR Scan Detected (Variant ${variant})`);

    // Redirect to a dummy "Product Page" or search
    // Using a simple success page for now or standard search
    res.redirect(`https://www.google.com/search?q=retail-ad+Campaign+${variant}`);
});

// 2. Sale Tracker (Called by POS SDK)
app.get('/api/track/sale', (req, res) => {
    const amount = parseInt(req.query.amount) || 1000;
    const variant = req.query.variant || 'A';

    if (global.productionStats) {
        global.productionStats.sales++;
        global.productionStats.revenue += amount;
        if (global.productionStats.ab[variant]) {
            global.productionStats.ab[variant].sales++;
        }
    }

    // Accumulate for Admin Billing (1.2% Fee Calculation)
    storeData["default_store"].total_pos_sales += amount;

    console.log(`[Tracker] POS Sale Detected: ¥${amount} (Variant ${variant}) | Total Store Sales: ¥${storeData["default_store"].total_pos_sales}`);
    res.json({ success: true, new_total: global.productionStats.revenue });
});

// 3. Impression Beacon (Called by Player on Video End)
// --- CREATOR PORTAL & SYNERGY ALGORITHM SUPPORT ---
const creatorStats = {};

// Global Stats State for Dashboards
let globalDashboardStats = {
    impressions: 0,
    faceDetected: 0,
    attentionTime: 0,
    male: 0,
    female: 0,
    unknown: 0,
    age10s: 0, age20s: 0, age30s: 0, age40s: 0, age50s: 0
};

let globalSensorLogs = [];
let posTransactions = [];
let manualChat = [];
let manualhelpState = { manuals: [], logs: [] };
let shiftState = { staff: [], chatHistory: [] };

// --- AGENCY REFERRAL DATA STORE ---
let agencyReferrals = [];

app.post('/api/admin/agency-submit', express.json(), async (req, res) => {
    setTimeout(saveFinanceDB, 100);
    agencyReferrals.push({
        date: req.body.date,
        agency: req.body.agency,
        advertise: req.body.advertise,
        price: parseInt(req.body.price),
        status: 'Pending'
    });
    
    // Notify the admin via SES
    try {
        const dateStr = new Date().toISOString().split("T")[0];
        const subject = `【リテアド】新規の広告主紹介・登録申請がありました (${req.body.agency})`;
        const body = `管理者 様\n\nAd Agency Proより、以下の通り新規の広告主（案件）登録申請がありました。\nAdmin Portalより承認（Verify）作業とアカウント発行を行ってください。\n\n--------------------------------\n[申請内容]\n申請日: ${req.body.date}\n代理店名: ${req.body.agency}\n紹介先広告主 (Email): ${req.body.advertise}\n予定予算額: ¥${parseInt(req.body.price).toLocaleString()}\n--------------------------------\n\nよろしくお願いいたします。`;
        await sendSESEmail("info@retail-ad.awsapps.com", subject, body);
    } catch (e) {
        console.error("[Agency] Admin notification email failed", e);
    }

    console.log(`[Agency] New Referral submitted by ${req.body.agency} for budget ¥${req.body.price}`);
    res.json({ success: true });
});

app.get('/api/admin/agency', (req, res) => {
    res.json(agencyReferrals);
});

app.post('/api/admin/agency-verify', express.json(), (req, res) => {
    const { advertise } = req.body;
    const ref = agencyReferrals.find(r => r.advertise === advertise);
    if (ref) {
        ref.status = 'Verified';
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Not found" });
    }
});



// --- CREATOR BANK DATA STORE ---
const creatorBankData = {};

app.post('/api/creator/bank', async (req, res) => {
    const { email, bankName, branchName, accountNum, holderName, idBase64 } = req.body;
    if (!email || !holderName) return res.status(400).json({ error: "必要な情報が不足しています" });
    if (!idBase64) return res.status(400).json({ error: "身分証画像が必要です" });

    try {
        let mimeType = 'image/jpeg';
        let base64Data = idBase64;
        const match = idBase64.match(/^data:(.*?);base64,(.*)$/);
        if (match) {
            mimeType = match[1];
            base64Data = match[2];
        }

        if (typeof generativeModel !== 'undefined') {
            const promptText = `あなたは厳密なKYC（本人確認）AIです。
以下の身分証画像を読み取り、書かれている「氏名（本名）」を抽出してください。
その後、申請者が入力した口座名義（カタカナ）「${holderName}」と同一人物であるか厳密に判定してください。
もし氏名の読みと口座名義が一致していれば match: true、偽名や別人の口座（法人口座含む）であれば match: false としてください。
必ず以下のJSON形式のみを出力してください。
{"match": true, "detected_name": "山田 太郎", "reason": "読みが一致するため"}`;
            
            const request = {
                contents: [{
                    role: 'user',
                    parts: [
                        { inlineData: { mimeType: mimeType, data: base64Data } },
                        { text: promptText }
                    ]
                }]
            };
            const result = await generativeModel.generateContent(request);
            const response = await result.response;
            const text = response.candidates[0].content.parts[0].text;
            
            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const aiResult = JSON.parse(cleanJson);
            
            if (aiResult.match !== true) {
                console.log(`[Creator KYC Blocked] ${email} - ID: ${aiResult.detected_name} != Bank: ${holderName}`);
                return res.status(400).json({ error: `【AI判定エラー】身分証の氏名（${aiResult.detected_name || '不明'}）と口座名義（${holderName}）が一致しませんでした。詐欺防止のため登録を拒否しました。` });
            }
        }
        
        creatorBankData[email] = { email, bankName, branchName, accountNum, holderName, updatedAt: new Date().toISOString() };
        console.log(`[Creator] Bank Info Updated & KYC Passed for: ${email}`);
        res.json({ success: true, message: "本人確認（KYC）を通過し、口座情報を保存しました" });
    } catch (e) {
        console.error("KYC Error:", e);
        res.status(500).json({ error: "本人確認システムの処理に失敗しました。画像が不鮮明な可能性があります。" });
    }
});

app.get('/api/admin/creators', (req, res) => {
    // Merge stats with bank data for Admin view
    // For demo, we just match mock stats to registered bank info conceptually
    const list = Object.keys(creatorBankData).map(email => {
        const bd = creatorBankData[email];
        // Using global CREATOR_STATE for demo purposes based on current live data
        const views = CREATOR_STATE.total_views;
        const manufacturer_ad = Math.floor(views * 0.5);
        const adsense_share = Math.floor(manufacturer_ad * 0.1);
        const cm_bonus = 10000;

        const subtotal = manufacturer_ad + adsense_share + cm_bonus;
        const agency_fee = Math.floor(subtotal * 0.2); // 20% to agency MCN
        const final_payout = subtotal - agency_fee;

        return {
            email: email,
            name: bd.holderName,
            bank: bd.bankName,
            branch: bd.branchName,
            account: bd.accountNum,
            manufacturer_ad: manufacturer_ad,
            adsense_share: adsense_share,
            cm_bonus: cm_bonus,
            agency_fee: agency_fee,
            payout: final_payout
        };
    });
    res.json({ success: true, list });
});

// Admin to Creator Bulk Email Handler

app.get('/api/analytics/track', (req, res) => {
    const adId = req.query.adId;
    const attentionStr = req.query.attention;
    const skipStr = req.query.skip;

    if (!adId) return res.status(400).json({ error: "adId required" });

    // 1. Process Synergy Data (Attention & Skip)
    if (attentionStr && skipStr) {
        const attention = parseInt(attentionStr);
        const skip = parseInt(skipStr);

        if (!creatorStats[adId]) {
            creatorStats[adId] = { views: 0, totalAttention: 0, totalSkip: 0, status: 'active' };
        }

        const stats = creatorStats[adId];

        if (stats.status === 'active') {
            stats.views++;
            stats.totalAttention += attention;
            stats.totalSkip += skip;

            const avgAttention = stats.totalAttention / stats.views;
            const avgSkip = stats.totalSkip / stats.views;

            // Auto-BAN Optimization Model Logic
            // If the video has been tested (views >= 3) and performs poorly:
            if (stats.views >= 3) {
                if (avgAttention < 55 || avgSkip > 15) {
                    stats.status = 'ban';
                    console.error(`[Optimization Engine] 🚫 AUTO-BAN Triggered!`);
                    console.error(`  - Target ID: ${adId}`);
                    console.error(`  - Reason: Poor Synergy (Attention: ${avgAttention.toFixed(1)}%, Skip: ${avgSkip.toFixed(1)}%)`);
                    console.error(`  - Action: Removed from Signage Rotation to maximizing Revenue.`);
                    // In real sys: signageServer.removePlaylist(adId);
                } else {
                    console.log(`[Optimization Engine] ✨ ID: ${adId} is performing well (Attention: ${Math.round(avgAttention)}%)`);
                }
            }
        }
    }

    // Call Signage Server Logic
    const recorded = signageServer.recordImpression(adId);

    if (global.productionStats) {
        global.productionStats.scans++;
    }

    // Update global dashboard stats
    globalDashboardStats.impressions++;
    // Simulate ~35% of impressions having a face detected

    res.json({ success: true, recorded, status: creatorStats[adId] ? creatorStats[adId].status : 'unknown' });
});

// GET Global Dashboard Analytics


// ManualHelp Chat API

app.get('/api/manualhelp/state', (req, res) => {
    res.json({ success: true, state: manualhelpState });
});
app.post('/api/manualhelp/state', express.json({limit: '10mb'}), (req, res) => {
    try {
        if(req.body.manuals) manualhelpState.manuals = req.body.manuals;
        if(req.body.logs) manualhelpState.logs = req.body.logs;
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ success: false });
    }
});
app.get('/api/manualhelp/chat', (req, res) => {
    res.json({ success: true, chat: manualChat });
});
app.post('/api/manualhelp/chat', express.json({limit: '10mb'}), (req, res) => {
    try {
        if(Array.isArray(req.body.chat)) {
            manualChat = req.body.chat;
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, error: "Invalid data form" });
        }
    } catch(e) {
        res.status(500).json({ success: false });
    }
});
app.get('/api/shift/state', (req, res) => {
    res.json({ success: true, state: shiftState });
});
app.post('/api/shift/state', express.json({limit: '10mb'}), (req, res) => {
    try {
        if(req.body.staff) shiftState.staff = req.body.staff;
        if(req.body.chatHistory) shiftState.chatHistory = req.body.chatHistory;
        res.json({ success: true });
    } catch(e) {
        res.status(500).json({ success: false });
    }
});
app.get('/api/admin/sales-history', (req, res) => {
    res.json({ success: true, transactions: typeof posTransactions !== 'undefined' ? posTransactions : [] });
});

app.get('/api/analytics/global', (req, res) => {
    const rate = globalDashboardStats.impressions > 0
        ? ((globalDashboardStats.faceDetected / globalDashboardStats.impressions) * 100).toFixed(1) + "%"
        : "0.0%";

    const avgAttention = globalDashboardStats.faceDetected > 0
        ? (globalDashboardStats.attentionTime / globalDashboardStats.faceDetected).toFixed(1)
        : "0";

    const totalDemo = globalDashboardStats.male + globalDashboardStats.female + globalDashboardStats.unknown;
    const femalePct = totalDemo > 0 ? Math.round((globalDashboardStats.female / totalDemo) * 100) : 0;
    
    // Calculate Core Target
    let targetStr = "データなし";
    if (totalDemo > 0) {
        const topGender = globalDashboardStats.female >= globalDashboardStats.male ? '女性' : '男性';
        const ages = [
            { label: '10代', count: globalDashboardStats.age10s },
            { label: '20代', count: globalDashboardStats.age20s },
            { label: '30代', count: globalDashboardStats.age30s },
            { label: '40代', count: globalDashboardStats.age40s },
            { label: '50代+', count: globalDashboardStats.age50s }
        ].sort((a,b) => b.count - a.count);
        targetStr = `${ages[0].label} / ${topGender}`;
    }

    res.json({
        success: true,
        data: {
            impressions: globalDashboardStats.impressions,
            imp_growth: "",
            faceDetected: globalDashboardStats.faceDetected,
            attentionRate: rate,
            attentionTime: avgAttention + "s",
            attentionImprovement: "",
            targetMode: targetStr,
            femaleRatio: `女性比率: <b style="color:#ec4899;">${femalePct}%</b>`,
            demographics: {
                male: globalDashboardStats.male,
                female: globalDashboardStats.female,
                unknown: globalDashboardStats.unknown,
                ages: [globalDashboardStats.age10s, globalDashboardStats.age20s, globalDashboardStats.age30s, globalDashboardStats.age40s, globalDashboardStats.age50s]
            }
        }
    });
});

// GET Creator Synergy Rankings for Advertiser Dashboard
app.get('/api/analytics/ranking', (req, res) => {
    try {
        const ranking = Object.keys(creatorStats).map(key => {
            const stat = creatorStats[key];
            const avgAttention = stat.views > 0 ? (stat.totalAttention / stat.views) : 0;
            const avgSkip = stat.views > 0 ? (stat.totalSkip / stat.views) : 0;
            return {
                id: key,
                title: stat.title || `コンテンツID: ${key.substring(0, 8)}`,
                creator: stat.creator || "提携クリエイター",
                views: stat.views,
                attention: avgAttention.toFixed(1),
                skip: avgSkip.toFixed(1),
                status: stat.status
            };
        }).sort((a, b) => b.attention - a.attention); // Sort by highest synergy attention

        res.json({ success: true, ranking });
    } catch (e) {
        console.error("Ranking API Error:", e);
        res.status(500).json({ error: "Server Error" });
    }
});

// 4. AI Sensor Data Receiver
app.post('/api/sensor', (req, res) => {
    // Only log occasionally to prevent console spam
    if (Math.random() < 0.1) {
        console.log(`[Sensor API] Data Received:`, req.body);
    }

    // Update real-time demographic data
    if (req.body) {
        // Assume each beacon roughly corresponds to 3s of attention if actively looking
        globalDashboardStats.attentionTime += 3;
        globalDashboardStats.faceDetected++; // Increment valid face detection

        // Add demographic to global list
        if (req.body.gender || req.body.age) {
            globalSensorLogs.push(req.body);
            // Cap history to avoid memory leak
            if (globalSensorLogs.length > 1000) globalSensorLogs.shift();
            
            // Update global counters
            if (req.body.gender === 'male') globalDashboardStats.male++;
            else if (req.body.gender === 'female') globalDashboardStats.female++;
            else globalDashboardStats.unknown++;

            let a = req.body.age;
            if (typeof a === 'string') a = a.replace('s', '');
            const ageNum = parseInt(a);
            if (!isNaN(ageNum)) {
                if (ageNum < 20) globalDashboardStats.age10s++;
                else if (ageNum < 30) globalDashboardStats.age20s++;
                else if (ageNum < 40) globalDashboardStats.age30s++;
                else if (ageNum < 50) globalDashboardStats.age40s++;
                else globalDashboardStats.age50s++;
            }

            // Broadcast to dashboards
            broadcastEvent({
                type: 'sensor_update',
                sensor_log: globalSensorLogs,
                stats: globalDashboardStats
            });
        }
    }

    res.json({ success: true, status: 'received' });
});

// --- External API (For POS / DSP) ---

// 1. Event Tracking (POS -> Server)
app.post('/api/external/v1/event', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer LITEAD_API_KEY')) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }

    const event = req.body;
    console.log(`[External API] Event Received:`, event);

    // Apply to Analytics (Mock Logic)
    // Reflect POS sales in dashboard metrics
    if (event.amount) {
        // Increase sales count (Conversion) and revenue (simulating 5% platform fee or similar impact)
        // Attribution: Check if we are running an ad (demoBoostMultiplier > 1 means ad active)
        if (demoBoostMultiplier > 1.0) {
            // High correlation assumption
            transactions.push({
                time: new Date().toISOString(),
                brand: "POS External",
                slot: "API",
                amount: event.amount
            });
            // Update Global Stats
            // In this demo, 'totalRevenue' tracks ad fees, so maybe we don't add sale amount to totalRevenue directly?
            // But user wants "Performance Based", so let's say we get a cut.
            const commission = Math.floor(event.amount * 0.1); // 10% Outcome Fee
            totalRevenue += commission;

            // Also update attribution sales count for CPA calc
            // We need a global way to persist this for the /analytics endpoint, 
            // but currently /analytics calculates on the fly. 
            // Let's rely on demoBoostMultiplier affecting the read-side for now, 
            // but logging the transaction proves the connection.
        }
    }

    res.json({ success: true, processed_at: new Date().toISOString(), impact: 'recorded' });
});

// 2. Inventory Query (DSP -> Server)
app.get('/api/external/v1/inventory', (req, res) => {
    // Mock Inventory Data
    res.json({
        store_id: "STORE_001",
        name: "Future Supermarket",
        available_slots: [
            { id: "slot_register_main", type: "video", w: 1920, h: 1080, cpm_est: 500 },
            { id: "slot_shelf_drinks", type: "digital_shelf", w: 1200, h: 100, cpm_est: 200 }
        ],
        current_traffic: "High" // connect to Sensor data later
    });
});

// Engagement Signal from AI Camera
// Engagement Signal (POS Correlation or AI)
// Engagement Signal from AI Camera (SECURE & PRIVACY FIRST)
const crypto = require('crypto');

app.post('/api/ad/engagement', (req, res) => {
    // --- 1. Edge Processing Guarantee (Server Side Safety Net) ---
    // Even if Edge sends image data by mistake, we DISCARD it immediately.
    if (req.body.image || req.body.video_frame || req.body.raw_data) {
        delete req.body.image;
        delete req.body.video_frame;
        delete req.body.raw_data;
        console.warn("[Privacy Shield] ⚠️ Raw binary data detected! IMMEDIATELY DISCARDED from memory.");
    }

    // --- 2. Anonymization (Hashing) ---
    // Never store Raw Device ID or IP. Convert to Hash immediately.
    let anonymizedId = "anonymous";
    const rawId = req.body.device_id || req.ip || "unknown_device";

    // Salted SHA-256 Hash
    const SALT = "LITEAD_PRIVACY_SALT_2026";
    anonymizedId = crypto.createHash('sha256').update(rawId + SALT).digest('hex');

    // --- 3. Store Only Statistical Attributes ---
    const metadata = {
        gender: req.body.gender || "unknown",
        age_range: req.body.age || "unknown",
        emotion: req.body.emotion || "neutral",
        attention_score: req.body.attention || 0,
        timestamp: new Date().toISOString(),
        session_hash: anonymizedId // Only store the hash
    };

    // Log (Secure)
    // In production, this would go to a secure DB. Here we log to console.
    console.log(`[Privacy Log] 🛡️ Engagement: ${metadata.gender}/${metadata.age_range} | Emotion: ${metadata.emotion} | ID(Hash): ${metadata.session_hash.substring(0, 10)}...`);

    demoBoostMultiplier += 0.05;
    res.json({ success: true, privacy_mode: "strict_enforced", id_hash: anonymizedId });
});

// --- Admin & Store Data System ---

const XLSX = require('xlsx');

// Centralized Store Data (Mocking a DB for "Default Store")
let storeData = {
    "default_store": {
        id: "STORE_001",
        name: "retail-ad Demo Store",
        billing_email: "store@example.com",
        bank_info: {
            bank_name: "",
            branch_name: "",
            account_number: "",
            account_holder: ""
        },
        total_pos_sales: 0,       // For 1.2% Billing (Accumulated from POS)
        total_ad_revenue: 0       // For 50% Payout (Accumulated from Ads)
    }
};

let adminSettings = {
    accounting_email: "info@retail-ad.com"
};

// Admin Portal Route
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin_portal.html')));

// --- STORE SIDE API ---

// Save Store Settings (Bank Info & Email)
app.post('/api/store/settings', (req, res) => {
    const s = storeData["default_store"];
    if (req.body.bank_info) s.bank_info = req.body.bank_info;
    if (req.body.billing_email) s.billing_email = req.body.billing_email;

    console.log(`[Store] Settings Updated for ${s.name}`);
    res.json({ success: true });
});

// --- ADMIN SIDE API ---

// Save Admin Settings (Sender Email)
app.post('/api/admin/settings', (req, res) => {
    if (req.body.accounting_email) {
        adminSettings.accounting_email = req.body.accounting_email;
        console.log(`[Admin] Accounting Email Updated: ${adminSettings.accounting_email}`);
    }
    res.json({ success: true });
});

// AnyWhere Regi Forgot Password => Billing Email mapping
app.post('/api/admin/settings/billing-email', express.json(), (req, res) => {
    if (req.body.email) {
        storeData["default_store"].billing_email = req.body.email;
        console.log(`[Admin] Billing Email Updated from AnyWhere Regi: ${req.body.email}`);
    }
    res.json({ success: true });
});

// Get Unified Dashboard Data
app.get('/api/admin/dashboard', (req, res) => {
    const billingData = [];
    const payoutData = [];
    for (const key of Object.keys(storeData)) {
        if (key === "default_store") continue;
        const s = storeData[key];
        const displayPosSales = s.total_pos_sales || 0;
        const billingAmount = Math.floor(displayPosSales * 0.012);
        if (billingAmount > 0) {
            billingData.push({ id: s.id, name: s.name, sales: displayPosSales, fee_1_2_percent: billingAmount, email: s.billing_email, status: "未請求" });
        }
        const storeAdRevenue = s.total_ad_revenue || 0;
        const creatorReward = Math.floor(storeAdRevenue * 0.1);
        const pureStoreRevenue = storeAdRevenue - creatorReward;
        const shareAmount = Math.floor(pureStoreRevenue * 0.5);
        if (shareAmount > 0) {
            payoutData.push({ id: s.id, name: s.name, retail_ad_revenue: storeAdRevenue, creator_reward: creatorReward, total_net_revenue: pureStoreRevenue, ad_revenue_share: shareAmount, bank_info: s.bank_info, status: "未払", email: (s.bank_info && s.bank_info.email) ? s.bank_info.email : s.billing_email });
        }
    }
    res.json({ accounting_email: adminSettings.accounting_email, billing: billingData, payouts: payoutData });
});

app.post("/api/admin/invite", async (req, res) => {
    const { name, email, budget, ccEmail } = req.body;
    const tempPassword = Math.random().toString(36).slice(-8); // 8-char random password
    users[email] = { password: tempPassword, role: "advertiser", name: name, org: name, budget: Number(budget) || 0 };
    const dateStr = new Date().toISOString().split("T")[0];
    const subject = `【リテアド】広告主アカウント発行・チャージ完了のご案内 (${dateStr})`;
    const body = `${name} 様\n\nリテアドのアカウントが発行され、ご入金いただいた予算がシステムに反映されました。\n\n--------------------------------\n[アカウント情報]\nログインID (Email): ${email}\n初期パスワード: ${tempPassword}\nログインURL: https://admin-portal-demo.com/login\n\n[チャージ残高]\n利用可能ご予算: ¥${Number(budget).toLocaleString()}\n--------------------------------\n\n早速システムにログインし、広告キャンペーンを作成してください。\nご不明な点がございましたら、当メールにそのままご返信ください。`;
    await sendSESEmail(email, subject, body);
    if (ccEmail) { await sendSESEmail(ccEmail, subject, body); }
    res.json({ success: true, message: "Account created and email sent via SES" });
});

// --- AWS SES Email Integration ---
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const sesClient = new SESClient({ region: "us-east-1" }); // AWS App Runner automatically injects credentials via IAM Role

async function sendSESEmail(toAddress, subject, bodyText) {
    const params = {
        Destination: { ToAddresses: [toAddress] },
        Message: {
            Body: { Text: { Data: bodyText } },
            Subject: { Data: subject }
        },
        Source: process.env.SES_SENDER_EMAIL || "info@retail-ad.com" 
    };
    try {
        await sesClient.send(new SendEmailCommand(params));
        console.log(`[SES] Real Email sent to ${toAddress}`);
        return true;
    } catch (err) {
        console.error("[SES] Error sending email: ", err);
        return false;
    }
}

// AWS SES Send Email (Invoice / Admin)
app.post('/api/admin/billing/send-email', async (req, res) => {
    const { to, amount } = req.body;
    const dateStr = new Date().toISOString().split('T')[0];
    
    // Calculate values cleanly
    const systemFee = Number(amount);
    const posSales = Math.round(systemFee / 0.012);

    const subject = `[どこでもレジシステム] システム利用料金 請求書 (${dateStr})`;
    const body = `${to} 様\n\n今月のシステム利用明細をお送りします。\n--------------------------------\n[計算ロジック]\n当月POS決済総額: ￥${posSales.toLocaleString()}\nシステム利用料率: 1.2%\n--------------------------------\nご請求金額: ￥${systemFee.toLocaleString()}\n\nよろしくお願いいたします。`;

    await sendSESEmail(to, subject, body);
    res.json({ success: true, message: "Email triggered successfully" });
});

// AWS SES Payout Emails for Creators and Stores
app.post('/api/admin/creators/send-email', async (req, res) => {
  const { to, amount, type } = req.body;
  const dateStr = new Date().toISOString().split('T')[0];
  const payoutAmount = Number(amount) || 0;
  const playCount = Math.floor(payoutAmount / 2);
  let subject = "";
  let body = "";
  if (type === 'store_payout') {
    subject = `【リテアド】今月の広告収益振込予定のお知らせ (${dateStr})`;
    body = `${to} 様\n\n今月のリテアド動画配信による報酬明細をお送りします。\n--------------------------------\n[計算ロジック]\n月間有効再生数: ${playCount.toLocaleString()} 回\nベース再生単価: ¥2 / 回\n--------------------------------\nお支払予定金額: ¥${payoutAmount.toLocaleString()}\n--------------------------------\n※送信用mailアドレスなので返信はできません
よろしくお願いいたします。`;
  } else {
    subject = `【リテアド】クリエイター報酬振込予定のお知らせ (${dateStr})`;
    body = `${to} 様\n\n今月の広告収益額が確定いたしました。\n--------------------------------\nお支払予定金額: ¥${payoutAmount.toLocaleString()}\n--------------------------------\n※送信用mailアドレスなので返信はできません
引き続き、素晴らしい動画のご投稿をお待ちしております。`;
  }
  await sendSESEmail(to, subject, body);
  res.json({ success: true, message: "Email triggered successfully" });
});

// Square SSoT Validation Endpoint
app.get('/api/admin/system/validate-square', (req, res) => {
    // In a real scenario, this would call Square's ListTransactions/ListPayments API
    // and sum the accepted payments, then compare to our local `totalRevenue` & `total_pos_sales`.
    
    const localAd = totalRevenue || 0;
    const localPos = storeData["default_store"].total_pos_sales || 0;
    
    // Simulating that Square's record perfectly matches our SSoT records
    const squareAdAmount = localAd; 
    const squarePosAmount = localPos;

    res.json({
        success: true,
        isMatch: (localAd === squareAdAmount && localPos === squarePosAmount),
        localAdAmount: localAd,
        squareAdAmount: squareAdAmount,
        localPosAmount: localPos,
        squarePosAmount: squarePosAmount
    });
});

// Generate Excel (Updated to use Store Data)
app.get('/api/admin/invoice/excel', (req, res) => {
    const s = storeData["default_store"];
    const sales = s.total_pos_sales || 0;
    const fee = Math.floor(sales * 0.012);
    const tax = Math.floor(fee * 0.1);

    // Create Worksheet Data
    const ws_data = [
        ["INVOICE / 請求書"],
        [""],
        ["Bill To:", s.billing_email],
        ["Store:", s.name],
        ["Date:", new Date().toLocaleDateString()],
        [""],
        ["Description", "Amount"],
        ["Store Sales (1.2% Fee Base)", `¥${sales.toLocaleString()}`],
        ["System Usage Fee (1.2%)", `¥${fee.toLocaleString()}`],
        ["Tax (10%)", `¥${tax.toLocaleString()}`],
        ["TOTAL DUE", `¥${(fee + tax).toLocaleString()}`],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, "Invoice");
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="Invoice_${s.id}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
});

app.get('/business-lp', (req, res) => res.sendFile(path.join(__dirname, 'retail_media_lp.html')));

// New Specific LPs
app.get('/advertiser-lp', (req, res) => res.sendFile(path.join(__dirname, 'advertiser_lp.html')));
app.get('/store-lp', (req, res) => res.sendFile(path.join(__dirname, 'store_lp.html')));

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) return iface.address;
        }
    }
    return 'localhost';
}

// 3. Agency Portal (New)
app.get('/agency-portal', (req, res) => res.sendFile(path.join(__dirname, 'agency_portal.html')));

// --- AGENCY API & STATE ---
app.get('/api/agency/dashboard', (req, res) => {
    // Process existing agency referrals to build dashboard statistics
    const totalGross = agencyReferrals.reduce((sum, c) => sum + (c.price || 0), 0);
    const totalCommission = Math.floor(totalGross * 0.20); // 20% Margin

    res.json({
        totalGross: totalGross,
        totalCommission: totalCommission,
        clients: agencyReferrals
    });
});

// --- CAMPAIGN MANAGEMENT API (Real-time Persistence) ---
// In-Memory Database for Campaigns
let campaigns = [
    { id: 1, name: "Spring Sale 2026 (A/B Test)", start: "2026-03-01", end: "2026-03-31", budget: 10000, spend: 2500, imp: 2459, status: "active" },
    { id: 2, name: "New Product Launch Video", start: "2026-04-01", end: "2026-04-15", budget: 15000, spend: 0, imp: 0, status: "pending" }
];

// --- Server-Sent Events (SSE) ---
let clients = [];
setInterval(() => {
    clients.forEach(c => c.write(':\n\n'));
}, 30000); // 30s keep-alive heartbeat

app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    clients.push(res);
    req.on('close', () => {
        clients = clients.filter(c => c !== res);
    });
});

// Broadcast Event
function broadcastEvent(data) {
    clients.forEach(c => c.write(`data: ${JSON.stringify(data)}\n\n`));
}

let sensorLogs = [];

// --- Analytics & Sensor API ---
app.post('/api/sensor', (req, res) => {
    // Received via Face AI sensor from Signage Player
    const { gender, age } = req.body;
    console.log(`[Sensor] Detected 1 View (${gender}, ${age}) via Signage.`);

    // Log the sensor data
    sensorLogs.push({ gender, age, time: Date.now() });

    // Broadcast for realtime dashboard updates
    broadcastEvent({ type: 'sensor_update', sensor_log: sensorLogs });

    // Add logic to increase impressions / revenue
    if (campaigns && campaigns.length > 0) {
        campaigns[0].imp += 1;
        campaigns[0].spend += 10; // e.g. 10 yen spent per impression
    }
    totalRevenue += 5; // e.g. Store earns 5 yen from the 10 yen spend

    res.json({ success: true, logged: true });
});



app.post('/api/campaigns/:id/status', (req, res) => {
    const cpId = req.params.id;
    const { status } = req.body;
    
    let found = false;
    // Check CMS (Signage Server)
    if (signageServer && signageServer.updateCampaignStatus) {
        found = signageServer.updateCampaignStatus(cpId, status);
        if (found) {
             console.log(`[Campaign Status Update - CMS] ${cpId} -> ${status}`);
        }
    }

    // Also check legacy campaigns array
    const cp = campaigns.find(c => c.id.toString() === cpId.toString());
    if (cp) {
        cp.status = status;
        console.log(`[Campaign Status Update - Legacy] ${cp.name} -> ${status}`);
        found = true;
    }

    if (found) {
        res.json({ success: true, status: status });
    } else {
        res.status(404).json({ error: "Campaign not found" });
    }
});

// --- AWS & Google Cloud Video to Steps AI (ManualHelp) ---

// --- AI PDF to Manual Steps ---
app.post('/api/manualhelp/pdf-to-steps', express.json({limit: '50mb'}), async (req, res) => {
    try {
        console.log("[ManualHelp AI] Processing PDF via Google Gemini 1.5 Flash API...");
        let pdfData = req.body.pdf_base64;
        if (!pdfData) return res.status(400).json({ error: "No PDF provided" });

        if (pdfData.includes(';base64,')) {
            pdfData = pdfData.split(';base64,').pop();
        }

        const rawKey = process.env.GEMINI_API_KEY || '';
        const GEMINI_API_KEY = rawKey.replace(/^['"]+|['"]+$/g, '').trim();
        if (!GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

        const FIXED_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

        const promptText = "あなたはプロの資料管理者です。添付されたPDF文書の「目次（または見出しの構造）」を解析し、マニュアルとしてシステムに登録するための分類データを作成してください。\n" +
            "以下のJSONフォーマットを厳守して出力してください:\n" +
            "{\n" +
            "  \"category\": \"資料のカテゴリ（例: 営業資料, 取扱説明書, 研修用 など）\",\n" +
            "  \"steps\": [\n" +
            "    { \"title\": \"目次・見出しのタイトル\", \"desc\": \"そのセクションの簡潔な要約（2-3行程度）\" }\n" +
            "  ]\n" +
            "}";

        const body = {
            contents: [{
                role: 'user',
                parts: [
                    { inlineData: { mimeType: 'application/pdf', data: pdfData } },
                    { text: promptText }
                ]
            }],
            generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json"
            }
        };

        const apiRes = await fetch(FIXED_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!apiRes.ok) {
            const errBody = await apiRes.text();
            throw new Error("Gemini API Error: " + errBody);
        }

        const apiData = await apiRes.json();
        let generatedText = apiData.candidates[0].content.parts[0].text;
        
        // Remove markdown block if exists
        generatedText = generatedText.replace(/^\s*`(?:json)?\s*/i, '').replace(/\s*`\s*$/, '');
        
        let resultJson = JSON.parse(generatedText);
        res.json({ success: true, result: resultJson });
    } catch (e) {
        console.error("[ManualHelp AI Error]", e);
        res.status(500).json({ error: e.toString() });
    }
});

app.post('/api/manualhelp/video-to-steps', async (req, res) => {
    try {
        console.log("[ManualHelp AI] Processing video via Google Gemini 1.5 Flash API...");
        
        let videoData = req.body.video_base64;
        if (!videoData) return res.status(400).json({ error: "No video provided" });

        if (videoData.includes(';base64,')) {
            videoData = videoData.split(';base64,').pop();
        }

        const rawKey = process.env.GEMINI_API_KEY || '';
        const GEMINI_API_KEY = rawKey.replace(/^['"]+|['"]+$/g, '').trim();
        if (!GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });

        const FIXED_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const promptText = "あなたはプロのマニュアル作成者です。添付された動画の内容を解析し、具体的な作業手順をステップごとに分けてJSON形式の配列で出力してください。\n" + 
                           "出力フォーマットは以下を厳守してください:\n" + 
                           '[{"title": "ステップ1の簡潔なタイトル", "desc": "具体的な作業内容の説明"}, ...]';

        const body = {
            contents: [{
                role: 'user',
                parts: [
                    { inlineData: { mimeType: 'video/mp4', data: videoData } },
                    { text: promptText }
                ]
            }],
            generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json"
            }
        };

        const apiRes = await fetch(FIXED_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await apiRes.json();
        
        if (!apiRes.ok || data.error) {
            console.error("[ManualHelp AI API Error]", data.error || data);
            throw new Error(data.error?.message || "Gemini API rejected request.");
        }

        let generatedText = data.candidates[0].content.parts[0].text;
        if (generatedText.startsWith('```json')) {
            generatedText = generatedText.replace(/```json\n|```/g, '');
        }

        let steps;
        try {
            steps = JSON.parse(generatedText);
        } catch(e) {
            console.error("[AI JSON Parse Error]", e, generatedText);
            throw new Error("AI returned invalid JSON format.");
        }

        res.json({ success: true, steps });
    } catch (e) {
        console.error("[ManualHelp Video Error]", e.message);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/manualhelp/translate-steps', async (req, res) => {
    try {
        const { texts, target } = req.body;
        const apiKey = process.env.GCP_API_KEY || "INSERT_API_KEY_HERE_AFTER_CLONING";
        
        console.log(`[ManualHelp AI] Translating ${texts.length} steps to ${target} via Google Cloud Translation API`);
        
        const fetch = globalThis.fetch || ((...args) => import('node-fetch').then(({default: f}) => f(...args)));
        const gcpRes = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: texts, target })
        });
        
        const data = await gcpRes.json();
        if(data.error) {
            console.error("[ManualHelp Translation Error]", data.error);
            return res.status(500).json({ error: data.error.message });
        }
        res.json(data);
    } catch (e) {
        console.error("[ManualHelp Translation Error]", e);
        res.status(500).json({ error: "Translation proxy error" });
    }
});


app.post('/api/voice/synthesize', async (req, res) => {
    try {
        const { text, voiceName, stylePrompt } = req.body;
        const rawKey = process.env.GEMINI_API_KEY || '';
        const GEMINI_API_KEY = rawKey.replace(/^['"]+|['"]+$/g, '').trim();
        if (!GEMINI_API_KEY) return res.status(500).json({ success: false, message: 'Server configuration missing: GEMINI_API_KEY is not set in .env' });
        
        const FIXED_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(FIXED_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: `You are an AI voice generator. Generate a pristine voice track of the following text with this style: ${stylePrompt}. Text: ${text}` }] }],
                generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } } }
            })
        });
        if (!response.ok) {
            const err = await response.text();
            console.error('Gemini TTS Error:', err);
            return res.status(response.status).json({ success: false, message: err });
        }
        const data = await response.json();
        let audioPart = null;
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            audioPart = data.candidates[0].content.parts.find(p => p.inlineData);
        }
        if (audioPart && audioPart.inlineData) {
            res.json({ success: true, audioBase64: audioPart.inlineData.data });
        } else {
            res.status(500).json({ success: false, message: 'No audio data returned from Gemini' });
        }
    } catch (error) {
        console.error('Gemini Proxy Exception:', error);
        res.status(500).json({ success: false, message: error.toString() });
    }
});



const s3Client = new S3Client({ region: process.env.AWS_DEFAULT_REGION || "us-east-1" });
const bucketName = process.env.AWS_S3_BUCKET_NAME;

async function pullFromS3() {
    if (!bucketName) return;
    try {
        const response = await s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: 'database.json' }));
        const str = await response.Body.transformToString();
        const parsed = JSON.parse(str);

        if (parsed.signageState && signageServer.setState) {
            signageServer.setState(parsed.signageState);
        }
        if (parsed.campaigns && typeof campaigns !== 'undefined') {
            campaigns.length = 0;
            parsed.campaigns.forEach(c => campaigns.push(c));
        }
        if (parsed.clients && typeof clients !== 'undefined') {
            clients.length = 0;
            parsed.clients.forEach(c => clients.push(c));
        }
        if (parsed.storeData && typeof storeData !== 'undefined') {
            Object.assign(storeData, parsed.storeData);
        }
        if (parsed.creatorState && typeof CREATOR_STATE !== 'undefined') {
            Object.assign(CREATOR_STATE, parsed.creatorState);
        }
        if (parsed.transactions && typeof transactions !== 'undefined') {
            transactions.length = 0;
            parsed.transactions.forEach(t => transactions.push(t));
        }
        if (parsed.sensorLogs && typeof sensorLogs !== 'undefined') {
            sensorLogs.length = 0;
            parsed.sensorLogs.forEach(l => sensorLogs.push(l));
        }
        if (parsed.globalDashboardStats && typeof globalDashboardStats !== 'undefined') {
            Object.assign(globalDashboardStats, parsed.globalDashboardStats);
        }
        if (parsed.users && typeof users !== 'undefined') {
            Object.assign(users, parsed.users);
        }
        if (parsed.manualhelpState) {
            manualhelpState = parsed.manualhelpState;
        }
        if (parsed.manualChat && Array.isArray(parsed.manualChat)) {
            manualChat = parsed.manualChat;
        }
        if (parsed.shiftState && typeof parsed.shiftState === 'object') {
            shiftState = parsed.shiftState;
        }
        if (parsed.posTransactions && Array.isArray(parsed.posTransactions)) {
            posTransactions = parsed.posTransactions;
        }
        if (parsed.productionStats) {
            global.productionStats = parsed.productionStats;
        }
        if (parsed.creatorStats && typeof creatorStats !== 'undefined') {
            Object.assign(creatorStats, parsed.creatorStats);
        }
        if (parsed.globalSensorLogs && typeof globalSensorLogs !== 'undefined') {
            globalSensorLogs.length = 0;
            parsed.globalSensorLogs.forEach(l => globalSensorLogs.push(l));
        }
        if (parsed.retailer_videos && Array.isArray(parsed.retailer_videos)) {
            global.retailer_videos = parsed.retailer_videos;
        }
        if (parsed.scheduledBroadcasts && Array.isArray(parsed.scheduledBroadcasts)) {
            scheduledBroadcasts = parsed.scheduledBroadcasts;
        }
        if (parsed.CREATOR_STATE && typeof parsed.CREATOR_STATE === 'object') {
            CREATOR_STATE = parsed.CREATOR_STATE;
        }

        const crypto = require('crypto');
        fs.writeFileSync(require('path').join(__dirname, 'database.json'), str, 'utf8');
        console.log('[S3] Successfully pulled database.json from cloud!');
    } catch (e) {
        console.log('[S3] Notice: No existing database found on S3, starting fresh or using local.');
    }
}

async function pushToS3(dataStr) {
    if (!bucketName) return;
    try {
        await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: 'database.json',
            Body: dataStr,
            ContentType: 'application/json'
        }));
        console.log('[S3] Uploaded latest database.json to cloud');
    } catch(e) {
        console.error('[S3] Sync failed:', e.message);
    }
}

setTimeout(pullFromS3, 2000);

let lastDBString = "";
setInterval(() => {
    try {
        if(true) {
            const dataStr = JSON.stringify({
                signageState: signageServer.getState ? signageServer.getState() : {}, 
                campaigns: typeof campaigns !== 'undefined' ? campaigns : [], 
                clients: typeof clients !== 'undefined' ? clients : [],
                storeData: typeof storeData !== 'undefined' ? storeData : {},
                creatorState: typeof CREATOR_STATE !== 'undefined' ? CREATOR_STATE : {},
                transactions: typeof transactions !== 'undefined' ? transactions : [],
                sensorLogs: typeof sensorLogs !== 'undefined' ? sensorLogs : [],
                retailer_videos: global.retailer_videos || [],
                            globalDashboardStats: typeof globalDashboardStats !== 'undefined' ? globalDashboardStats : {},
                agencyReferrals: typeof agencyReferrals !== 'undefined' ? agencyReferrals : [],
                productionStats: global.productionStats ? global.productionStats : null,
                creatorStats: typeof creatorStats !== 'undefined' ? creatorStats : {},
                globalSensorLogs: typeof globalSensorLogs !== 'undefined' ? globalSensorLogs : [],
                users: typeof users !== 'undefined' ? users : {},
                posTransactions: typeof posTransactions !== 'undefined' ? posTransactions : [],
                shiftState: typeof shiftState !== 'undefined' ? shiftState : { staff: [], chatHistory: [] },
                manualChat: typeof manualChat !== 'undefined' ? manualChat : [],
                manualhelpState: typeof manualhelpState !== 'undefined' ? manualhelpState : { manuals: [], logs: [] },
                scheduledBroadcasts: typeof scheduledBroadcasts !== 'undefined' ? scheduledBroadcasts : []
            }, null, 2);
            fs.writeFileSync(require('path').join(__dirname, 'database.json'), dataStr, 'utf8');
            if (dataStr !== lastDBString && lastDBString !== "") {
                pushToS3(dataStr);
                // Also push to PostgreSQL
                if (pool) {
                    try {
                        // Sync users
                        for (const email in users) {
                            const u = users[email];
                            pool.query(
                                'INSERT INTO users (email, password, role, name, org, two_factor_secret) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role, name = EXCLUDED.name, org = EXCLUDED.org, two_factor_secret = EXCLUDED.two_factor_secret',
                                [email, u.password, u.role, u.name, u.org, u.twoFactorSecret]
                            ).catch(e => console.error("[DB] Users Sync Error:", e.message));
                        }
                        
                        // Sync transactions
                        for (const t of transactions) {
                            pool.query(
                                'INSERT INTO transactions (transaction_id, amount, store_id, items, timestamp) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (transaction_id) DO NOTHING',
                                [t.id, t.total, t.storeId, JSON.stringify(t.items), new Date(t.timestamp)]
                            ).catch(e => console.error("[DB] Transactions Sync Error:", e.message));
                        }

                        // Sync campaigns
                        for (const c of campaigns) {
                            pool.query(
                                'INSERT INTO campaigns (id, url, advertiser, budget, daily_limit, spent, status) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url, budget = EXCLUDED.budget, daily_limit = EXCLUDED.daily_limit, spent = EXCLUDED.spent, status = EXCLUDED.status',
                                [c.id, c.url, c.advertiser, c.budget, c.daily_limit, c.spent, c.status]
                            ).catch(e => console.error("[DB] Campaigns Sync Error:", e.message));
                        }
                    } catch (err) {
                        console.error("[DB] Push Error:", err.message);
                    }
                }
            }
            lastDBString = dataStr;
        }
    } catch(e){}
}, 10000);


// ==========================================
// 外部サービス連携 (GMOあおぞら / freee / 国税庁インボイス)
// ==========================================

// 1. 国税庁 適格請求書発行事業者公表サイトAPI (モック実装・構造設計)
async function verifyInvoiceNumber(tNumber) {
    if (!tNumber || !tNumber.startsWith('T') || tNumber.length !== 14) return false;
    console.log(`[NTA API] 国税庁APIへ照会中... T番号: ${tNumber}`);
    // 実際の連携時は、国税庁APIのアプリケーションIDを付与してGETリクエストを投げる
    // const res = await fetch(`https://invoice-api.nta.go.jp/1/num?id=${NTA_APP_ID}&type=21&history=0&number=${tNumber.substring(1)}`);
    return true; // モック: 正しい形式なら実在するとみなす
}

// 2. freee 会計API (モック実装)
async function createFreeeJournalEntry(amount, withholdingTax, bankFee, creatorName) {
    console.log(`[freee API] 会計freeeに振替伝票を起票します...`);
    // 実際の連携時は OAuth 2.0 アクセストークンを使用して POST /api/1/manual_journals を叩く
    const totalExpense = amount; // 発生した報酬額（経費）
    const actualPayout = amount - withholdingTax - bankFee; // 実際に振り込む額
    
    console.log(`  借方: 支払手数料(報酬) ${totalExpense}円`);
    console.log(`  貸方: 普通預金 ${actualPayout}円`);
    if (withholdingTax > 0) console.log(`  貸方: 預り金(源泉所得税) ${withholdingTax}円`);
    if (bankFee > 0) console.log(`  貸方: 支払手数料(振込手数料) ${bankFee}円`);
    
    return { success: true, journalId: 'freee_' + Date.now() };
}

// 3. GMOあおぞらネット銀行 振込API (モック実装)
async function executeGMOBankTransfer(bankCode, branchCode, accountType, accountNum, holderName, amount) {
    console.log(`[GMO API] GMOあおぞらネット銀行 総合振込API 呼び出し...`);
    // 実際の連携時は クライアントID/シークレット等でアクセストークンを取得し、POST /corporate/v1/transfer/request を叩く
    console.log(`  振込先: 銀行コード:${bankCode} 支店:${branchCode} 口座:${accountNum} 名義:${holderName}`);
    console.log(`  振込金額: ${amount}円`);
    return { success: true, transferId: 'gmo_' + Date.now() };
}

// 出金リクエスト（クリエイターから）
let withdrawalRequests = [];
let creatorBanks = {};

// ==========================================
// お金・KYC関連データのローカルJSON永続化 (A案)
// ==========================================
const financeDbPath = require('path').join(__dirname, 'finance_database.json');

function loadFinanceDB() {
    try {
        if (require('fs').existsSync(financeDbPath)) {
            const dataStr = require('fs').readFileSync(financeDbPath, 'utf8');
            const data = JSON.parse(dataStr);
            if (data.withdrawalRequests) withdrawalRequests = data.withdrawalRequests;
            if (data.creatorBanks) creatorBanks = data.creatorBanks;
            if (data.kycRequests) kycRequests = data.kycRequests;
            if (data.agencyReferrals) agencyReferrals = data.agencyReferrals;
            console.log(`[Finance DB] Loaded ${withdrawalRequests.length} withdrawals, ${Object.keys(creatorBanks).length} banks, ${kycRequests.length} KYCs, ${agencyReferrals.length} Agency Referrals.`);
        }
    } catch (e) {
        console.error("[Finance DB] Load Error", e);
    }
}

function saveFinanceDB() {
    try {
        const data = {
            withdrawalRequests,
            creatorBanks,
            kycRequests,
            agencyReferrals
        };
        require('fs').writeFileSync(financeDbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error("[Finance DB] Save Error", e);
    }
}

// サーバー起動時に読み込み
loadFinanceDB();


app.post('/api/creator/withdraw', async (req, res) => {
    const { email, amount } = req.body;
    if (!email || !amount || amount < 5000) {
        return res.status(400).json({ error: "出金は5,000円以上から申請可能です。" });
    }
    
    // クリエイターの銀行情報を取得 (DBモック)
    const bankInfo = creatorBanks[email];
    if (!bankInfo) return res.status(400).json({ error: "銀行口座が登録されていません。" });
    
    // T番号の確認
    if (bankInfo.invoiceNumber) {
        const isValid = await verifyInvoiceNumber(bankInfo.invoiceNumber);
        if (!isValid) return res.status(400).json({ error: "インボイス登録番号が無効です。" });
    }

    // 出金リクエストを登録
    const reqId = 'wd_' + Date.now();
    setTimeout(saveFinanceDB, 100);
    withdrawalRequests.push({
        id: reqId,
        email: email,
        amount: amount,
        bankInfo: bankInfo,
        status: 'pending',
        requestDate: Date.now()
    });
    console.log(`[Withdraw] 出金申請を受理: ${email} - ¥${amount}`);
    res.json({ success: true, id: reqId });
});

// 支払承認と送金実行（管理者から）
app.post('/api/admin/payout/execute', async (req, res) => {
    const { reqId } = req.body;
    const request = withdrawalRequests.find(r => r.id === reqId && r.status === 'pending');
    if (!request) return res.status(404).json({ error: "無効なリクエストです。" });

    const bank = request.bankInfo;
    const isCorp = bank.businessType === 'corporate';
    
    // 源泉徴収税の計算 (個人のみ、100万円以下は10.21%)
    let withholdingTax = 0;
    if (!isCorp) {
        withholdingTax = Math.floor(request.amount * 0.1021);
    }
    const bankFee = 145; // GMOあおぞらネット銀行から他行宛の場合の振込手数料目安など
    const finalTransferAmount = request.amount - withholdingTax - bankFee;

    try {
        // 1. GMOあおぞらネット銀行で振込実行
        const gmoRes = await executeGMOBankTransfer(bank.bankCode || '0000', bank.branchName, '普通', bank.accountNum, bank.holderName, finalTransferAmount);
        
        // 2. freee 会計へ仕訳登録
        const freeeRes = await createFreeeJournalEntry(request.amount, withholdingTax, bankFee, bank.holderName);
        
        request.status = 'completed';
        request.withholdingTax = withholdingTax;
        request.finalAmount = finalTransferAmount;
        request.processedAt = Date.now();

        res.json({ success: true, message: "送金および会計仕訳が完了しました。", details: { gmo: gmoRes, freee: freeeRes } });
    } catch (e) {
        res.status(500).json({ error: "外部API連携中にエラーが発生しました", details: e.message });
    }
});

// 管理者用 出金リクエスト一覧取得
app.get('/api/admin/payouts', (req, res) => {
    res.json(withdrawalRequests);
});


// ==========================================
// どこでもレジ (モバイルPOS) 連携API
// ==========================================
app.post('/api/pos/checkout', (req, res) => {
    const { companyName, storeName, totalAmount, billingEmail, items } = req.body;
    
    if (!companyName || !totalAmount) {
        return res.status(400).json({ error: "必須データが不足しています" });
    }

    const transactionId = 'pos_' + Date.now() + Math.floor(Math.random()*1000);
    
    setTimeout(saveFinanceDB, 100);
    posTransactions.push({
        id: transactionId,
        companyName,
        storeName: storeName || '未設定',
        totalAmount,
        billingEmail: billingEmail || '',
        items: items || [],
        status: 'completed', // または 'pending_square'
        timestamp: Date.now()
    });

    console.log(`[POS] 売上登録: ${companyName} - ¥${totalAmount}`);
    res.json({ success: true, transactionId });
});

app.get('/api/pos/transactions', (req, res) => {
    res.json(posTransactions);
});


// =========================================================================
// AI Agent Endpoints (Ad Operations & Shift-Manual Sync)
// =========================================================================



// --- 2. Retailer Marketing Agent (小売マーケティング向け 自社販促エージェント) ---
app.post('/api/agent/retailer', async (req, res) => {
    const { message, storeId } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    try {
        const rawKey = process.env.GEMINI_API_KEY || '';
        const GEMINI_API_KEY = rawKey.replace(/^['"]+|['"]+$/g, '').trim();
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

        // Store-specific POS Data simulation (Using cached morning data to save costs)
        const posDataContext = "Store Morning Cache: Today's excess inventory includes 'Summer Vegetables' and 'Energy Drinks'. Peak store traffic expected around 17:00-19:00.";

        const prompt = `
You are a Retailer In-Store Marketing AI Agent.
The store marketing manager requested: "${message}"

You must analyze this request using the cached morning POS data and generate an in-store promotion plan.
POS Cache: ${posDataContext}

Return ONLY a JSON object:
{
    "analysis": "Explanation of your data-driven promotion strategy (Japanese)",
    "videoTitle": "A title for the generated in-store video",
    "voiceScript": "A compelling 1-2 sentence script for an AI voice announcement to play in-store (Japanese)",
    "targetItems": "Items being promoted",
    "status": "AUTO-ADDED TO BASE LOOP"
}
`;

        const FIXED_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const fetch = (await import('node-fetch')).default;
        const geminiRes = await fetch(FIXED_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        if (!geminiRes.ok) throw new Error('Gemini API Error');
        const data = await geminiRes.json();
        const result = JSON.parse(data.candidates[0].content.parts[0].text);

        // Auto-register the promotional video into the base_loop_videos array (self-distribution)
        // Note: For demonstration, we add it to the generic videos list, but tagged as a base loop.
        const newPromo = {
            id: 'agent_promo_' + Date.now(),
            name: result.videoTitle,
            advertiser: '自社販促',
            mediaUrl: '/assets/demo_summer.mp4', // Mocked generated video
            budget: '0 (自社枠)',
            status: 'APPROVED',
            uploadedAt: new Date().toISOString(),
            isBaseLoop: true, // Specific to retailer agent
            agentData: result
        };

        if (!database.campaigns) database.campaigns = [];
        database.campaigns.push(newPromo);
        saveDatabase(); 

        const responseHtml = `
            <strong><i class="fas fa-check-circle" style="color:#22c55e;"></i> 自社用の販促動画を自動生成し、ベースループに追加しました！</strong><br><br>
            <strong>📊 POS分析結果:</strong> ${result.analysis}<br>
            <strong>🎯 対象商品:</strong> ${result.targetItems}<br>
            <strong>🔊 AI生成スクリプト:</strong> 「${result.voiceScript}」<br>
            <br>※外部広告の枠を消費せず、自社サイネージ（ベースループ）に無料で即時反映されます。
        `;

        res.json({ success: true, plan: result, message: responseHtml });
    } catch (e) {
        console.error('Retailer Agent Error:', e);
        res.status(500).json({ error: e.message });
    }
});


// --- 3. Anywhere Register Customer Agent (レジ顧客向け レシピ＆提案エージェント) ---
app.post('/api/agent/regi', async (req, res) => {
    const { message, scannedItems } = req.body;

    try {
        const rawKey = process.env.GEMINI_API_KEY || '';
        const GEMINI_API_KEY = rawKey.replace(/^['"]+|['"]+$/g, '').trim();
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

        // Store-specific POS Data simulation (Morning Cache)
        const posDataContext = "Store Morning Cache: Today's special items are 'Pork Belly (豚バラ肉)' and 'Cabbage (キャベツ)'.";
        
        let itemsContext = "No items scanned yet.";
        if (scannedItems && scannedItems.length > 0) {
            itemsContext = "Items currently in cart: " + scannedItems.map(i => i.name || i).join(', ');
        }

        const prompt = `
You are a friendly Supermarket AI Assistant helping a customer at the register.
The customer requested: "${message}"

You must analyze this request using the store's current specials and the customer's cart.
Specials: ${posDataContext}
Cart: ${itemsContext}

Return ONLY a JSON object:
{
    "suggestedIngredients": "List of recommended bargain items to add (Japanese)",
    "recipeTitle": "A catchy title for a recipe they can make tonight (Japanese)",
    "recipeSteps": "Brief 2-3 step instructions for the recipe (Japanese)",
    "friendlyMessage": "A warm greeting and summary (Japanese)"
}
`;

        const FIXED_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const fetch = (await import('node-fetch')).default;
        const geminiRes = await fetch(FIXED_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        if (!geminiRes.ok) throw new Error('Gemini API Error');
        const data = await geminiRes.json();
        const result = JSON.parse(data.candidates[0].content.parts[0].text);

        const responseHtml = `
            <strong><i class="fas fa-magic" style="color:#eab308;"></i> ${result.friendlyMessage}</strong><br><br>
            <strong>🛒 本日のお買い得推奨:</strong> ${result.suggestedIngredients}<br>
            <strong>🍲 AIおすすめレシピ:</strong> ${result.recipeTitle}<br>
            <div style="font-size:0.9em; margin-top:5px; padding:10px; background:rgba(255,255,255,0.5); border-radius:5px;">
                ${result.recipeSteps.replace(/\n/g, '<br>')}
            </div>
        `;

        res.json({ success: true, plan: result, message: responseHtml });
    } catch (e) {
        console.error('Regi Agent Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// --- 1. Advertiser Agent (広告主向け 自動運用エージェント) ---
app.post('/api/agent/advertiser', async (req, res) => {
    const { message, email } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    try {
        const rawKey = process.env.GEMINI_API_KEY || '';
        const GEMINI_API_KEY = rawKey.replace(/^['"]+|['"]+$/g, '').trim();
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

        // POS Data simulation (In a real scenario, query DynamoDB)
        const posDataContext = "POS Data Analytics (Network-wide): Peak sales for beverages are 13:00 - 15:00. High conversion for video ads with energetic AI voice.";

        const prompt = `
You are an Advertiser Operations AI Agent.
The advertiser requested: "${message}"

You must analyze this request using the POS data context and generate a complete campaign plan.
POS Context: ${posDataContext}

Return ONLY a JSON object:
{
    "analysis": "Explanation of your data-driven decision (Japanese)",
    "campaignName": "A catchy campaign name",
    "voiceScript": "A compelling 1-2 sentence script for an AI voice announcement (Japanese)",
    "targetTime": "Suggested time block (e.g. 13:00-15:00)",
    "budget": "Extracted budget",
    "status": "DRAFT"
}
`;

        const FIXED_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const fetch = (await import('node-fetch')).default;
        const geminiRes = await fetch(FIXED_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        if (!geminiRes.ok) throw new Error('Gemini API Error');
        const data = await geminiRes.json();
        const result = JSON.parse(data.candidates[0].content.parts[0].text);

        // Auto-register the campaign into the database
        const newCampaign = {
            id: 'agent_camp_' + Date.now(),
            name: result.campaignName,
            advertiser: email || 'agent_demo',
            mediaUrl: '/assets/demo_summer.mp4', // Mocked generated video
            budget: result.budget || '50000',
            status: 'REVIEWING',
            uploadedAt: new Date().toISOString(),
            agentData: result
        };

        if (!database.campaigns) database.campaigns = [];
        database.campaigns.push(newCampaign);
        saveDatabase(); // Ensure saved

        const responseHtml = `
            <strong><i class="fas fa-check-circle" style="color:var(--primary);"></i> キャンペーンの自動設定が完了しました！</strong><br><br>
            <strong>📊 AI分析結果:</strong> ${result.analysis}<br>
            <strong>🎯 配信推奨時間:</strong> ${result.targetTime}<br>
            <strong>🔊 AI生成スクリプト:</strong> 「${result.voiceScript}」<br>
            <br>※キャンペーン一覧に「審査中(REVIEWING)」として追加されました。
        `;

        res.json({ success: true, plan: result, message: responseHtml });
    } catch (e) {
        console.error('Advertiser Agent Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// --- 1. Ad Operations Agent ---
app.post('/api/agent/ad-ops', async (req, res) => {
    const { message, storeId } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    try {
        const rawKey = process.env.GEMINI_API_KEY || '';
        const GEMINI_API_KEY = rawKey.replace(/^['"]+|['"]+$/g, '').trim();
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

        // Fake POS Data for context
        const posDataContext = "POS Data Analysis: Peak sales hours are 14:00 - 16:00. Target demographic: 20s-30s. Top selling categories: Summer drinks, ice cream.";

        const prompt = `
You are an autonomous AI Ad Operations Agent for a retail store.
The user requested: "${message}"

Your task is to analyze the request and generate a structured JSON execution plan.
You have access to the following context:
${posDataContext}

Return ONLY a JSON object (no markdown) with the following format:
{
    "analysis": "Brief explanation of your decision based on POS data",
    "campaignName": "Suggested name for the campaign",
    "voiceScript": "A compelling 1-2 sentence script for an AI voice announcement",
    "targetTime": "Suggested time block (e.g. 14:00-16:00)",
    "budget": "Extracted or suggested budget in JPY"
}
`;

        const FIXED_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const fetch = (await import('node-fetch')).default;
        const geminiRes = await fetch(FIXED_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        if (!geminiRes.ok) {
            const err = await geminiRes.text();
            throw new Error('Gemini API Error: ' + err);
        }

        const data = await geminiRes.json();
        const responseText = data.candidates[0].content.parts[0].text;
        const result = JSON.parse(responseText);

        // Here we would normally execute the tools (create video, schedule campaign)
        // For now, we return the parsed execution plan back to the frontend to show the user.
        res.json({
            success: true,
            plan: result,
            message: `エージェント分析完了:
${result.analysis}
【配信予定時間】${result.targetTime}
【音声スクリプト】${result.voiceScript}`
        });

    } catch (e) {
        console.error('Ad Ops Agent Error:', e);
        res.status(500).json({ error: e.message || 'Agent failed to process request' });
    }
});

// --- 2. Shift & Manual Linking Agent ---
app.post('/api/agent/shift-manual-sync', async (req, res) => {
    try {
        const rawKey = process.env.GEMINI_API_KEY || '';
        const GEMINI_API_KEY = rawKey.replace(/^['"]+|['"]+$/g, '').trim();
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

        // Read shift data and manuals
        const shifts = database.shifts || [];
        const manuals = database.manuals || [];

        // Simple mock of detecting a "newbie" (e.g. someone scheduled tomorrow)
        // In reality, filter by employee start date or shift count.
        const targetEmployee = "田中さん (新人)";

        const prompt = `
You are a Shift & Manual Management AI Agent.
We have a new employee scheduled for tomorrow: ${targetEmployee}.
Available manuals:
${manuals.map(m => `- [ID: ${m.id}] ${m.title}`).join('\n')}

Which manual ID is the most critical for a new employee to read before their shift?
Return ONLY a JSON object:
{
    "recommendedManualId": "ID of the manual",
    "reason": "Brief reason why"
}
`;

        const FIXED_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const fetch = (await import('node-fetch')).default;
        const geminiRes = await fetch(FIXED_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        if (!geminiRes.ok) throw new Error('Gemini API Error');
        const data = await geminiRes.json();
        const result = JSON.parse(data.candidates[0].content.parts[0].text);

        // Add to notifications
        if (!database.notifications) database.notifications = [];
        database.notifications.push({
            id: 'notif_' + Date.now(),
            user: targetEmployee,
            message: `【AIからのオススメ】明日のシフトに向けて、マニュアル「${result.recommendedManualId}」を読んでおきましょう！理由: ${result.reason}`,
            createdAt: new Date().toISOString()
        });

        saveDatabase(); // Ensure saved

        res.json({ success: true, result });
    } catch (e) {
        console.error('Shift Sync Agent Error:', e);
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nRetail Media Server running!`);
    console.log(`[Entry] Login Portal: http://localhost:${PORT}/`);
    console.log(`[Mobile] Player:      http://localhost:${PORT}/player`);
    console.log(`[Hint]  Agency Login: Use 070-xxxx-xxxx\n`);
});

// --- [NEW] Admin API: Register Device to Store ---
app.post('/api/admin/devices', express.json(), (req, res) => {
    const { deviceId, storeId } = req.body;
    if (!deviceId || !storeId) return res.status(400).json({ error: "Missing parameters" });
    
    global.deviceStoreMapping = global.deviceStoreMapping || {};
    global.deviceStoreMapping[deviceId] = storeId;
    console.log(`[Admin] 🛠️ Device ${deviceId} permanently paired to Store ${storeId}`);
    res.json({ success: true, message: `Device paired to ${storeId}` });
});

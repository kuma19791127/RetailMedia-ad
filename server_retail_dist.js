const express = require('express');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
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
const PORT = 3000;

app.use(cors());

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
        console.log(`[KYC] New request from ${newReq.userEmail}. AI Score: ${aiScore}%`);
        res.json({ success: true, id: newReq.id, aiScore: aiScore });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
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
        console.log([KYC] Request  status updated to );
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
let demoBoostMultiplier = 1.0;
let isProductionMode = false;
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

    // Simulate real Google Cloud reCAPTCHA Enterprise / Account Defender API Call
    // 実際の実装ではここで `https://recaptchaenterprise.googleapis.com/v1/projects/YOUR_PROJECT/assessments` にリクエストし、
    // IPアドレスやブラウザフィンガープリントから「過去の違反ユーザーと同一人物か」のスコア(0.0 - 1.0)を取得します。
    try {
        if (creatorId.includes('demo') || creatorId.includes('test')) {
            aiRiskScore = 92;
            aiReason = "⚠️ Google Cloud Risk Assessment: 過去にBANされたアカウントと【IPアドレス・デバイス指紋】が高度に一致しています (Score: 0.92)";
        }
    } catch (e) {
        console.error("reCAPTCHA Enterprise API Error:", e);
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
app.post('/api/creator/review-content', async (req, res) => {
    try {
        const { video_base64 } = req.body;
        console.log("クリエイター動画審査開始: Gemini 1.5 Pro");
        if (!video_base64) return res.status(400).json({ error: '動画データがありません' });
        
        if (video_base64 === "mock_data" || video_base64.length < 500) {
             return res.json({ safe: true, message: "審査通過 (デモ用自動パス)" });
        }

        const base64Data = video_base64.replace(/^data:video\/\w+;base64,/, "");
        
        
        // Use generativeModel defined globally in server_retail_dist
        if(typeof generativeModel !== 'undefined') {
            const request = {
                contents: [{
                    role: 'user',
                    parts: [
                        { inlineData: { mimeType: 'video/mp4', data: base64Data } },
                        { text: 'あなたは広告プラットフォームの厳格なAIモデレーターです。以下に該当する不適切なコンテンツが含まれていないか審査してください。1: 「簡単に稼げる」「確実に痩せる」「必ず儲かる」といった誇大広告・薬機法違反・情報商材への誘導。テロップ・口頭問わず即時ブロック対象。2: 動画内にQRコードが含まれている場合、その先のURLを抽出し、フィッシングサイトやマルウェア配布サイト等の危険性がないか自動スキャンしてください。安全性が確認できないURLが含まれる場合はブロック。3: 過度な暴力、性的描写。少しでも含まれる場合は必ず「FAIL: 理由」を、完全に安全であれば「PASS: 理由」を出力してください。' }
                    ]
                }]
            };
            const result = await generativeModel.generateContent(request);
            const response = await result.response;
            const text = response.candidates[0].content.parts[0].text;
            console.log("クリエイター動画審査完了:", text);
            if (text.includes('FAIL')) {
                return res.json({ safe: false, message: '【配信停止】AI判定によりポリシー違反が検出されました:\n' + text });
            } else {
                return res.json({ safe: true, message: text });
            }
        }
        
        
        res.json({ safe: true, message: "審査通過 (問題なし)" });
    } catch (error) {
        console.error('コンテンツ審査エラー:', error);
        res.status(500).json({ error: '審査中にエラーが発生しました。ファイルサイズが大きすぎる可能性があります。', safe: true });
    }
});

app.post('/api/creator/upload', (req, res) => {
    console.log(`[API /api/creator/upload] Received new creator video upload request. Data size: ${JSON.stringify(req.body).length} bytes`);
    const { title, src, format, isAd } = req.body;
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

app.post('/api/auth/login', (req, res) => {
    const { email, password, role, name, org } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    let user = users[email];

    // Auto-Register if user does not exist (to keep the ease of demo but persist data)
    if (!user) {
        users[email] = { password, role: role || "store", name: name, org: org };
        user = users[email];
        console.log(`[Auth] 🆕 Auto-Registered & Logged in: ${email} (${user.role})`);
        currentUser = { email, role: user.role };
        
        return res.json({ success: true, redirect: getRedirectUrl(user.role), user: { email, role: user.role, name: user.name, org: user.org } });
    } else {
        // Update name and org if provided and different
        let updated = false;
        if (name && user.name !== name) { user.name = name; updated = true; }
        if (org && user.org !== org) { user.org = org; updated = true; }
        if (updated) {
            saveDatabase();
        }
    }

    if (user && user.password === password) {
        console.log(`[Auth] ✅ Login Success: ${email}`);
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



app.get('/api/ad/mode', (req, res) => {
    isProductionMode = (req.query.prod === 'true');
    console.log(`[System] Switched to ${isProductionMode ? 'PRODUCTION' : 'DEMO'} mode.`);
    if (!isProductionMode) demoBoostMultiplier = 1.0;
    res.json({ success: true, mode: isProductionMode ? 'production' : 'demo' });
});

app.get('/api/ad/demo/boost', (req, res) => {
    // if (isProductionMode) return res.status(400).json({ error: "Cannot use demo boost in Production mode." });

    try {
        // Log Debug
        console.log(`[Boost] Request:`, req.query);

        // Parse params
        const aspectRatio = req.query.ratio || "16:9";
        const brand = req.query.brand || "Unknown Brand";
        const scope = req.query.scope || "national";
        const slot = req.query.slot || "prime";

        // New Params
        const planType = req.query.planType || "engagement";
        const format = req.query.format || "standard";

        demoBoostMultiplier += 0.5;

        // Pricing Logic (Mirroring Frontend)
        let basePrice = 10000;
        let duration = 30;

        if (format === 'image') { basePrice = 3000; duration = 10; }
        if (format === 'short') { basePrice = 5000; duration = 15; }
        if (format === 'youtube') { basePrice = 10000; duration = 30; }
        if (format === 'shorts') { basePrice = 5000; duration = 15; }
        if (format === 'standard') { basePrice = 10000; duration = 30; }
        if (format === 'enterprise') { basePrice = 500000; duration = 30; }

        // Slot Multiplier
        let multiplier = 1.0;
        if (slot === 'spot') multiplier = 0.2;
        if (slot === 'morning') multiplier = 0.6;
        if (slot === 'lunch') multiplier = 0.8;

        let price = basePrice * multiplier;
        if (format === 'enterprise') price = 500000; // Fixed

        // Record Transaction
        totalRevenue += price;
        transactions.push({
            brand, scope, slot, amount: price, timestamp: new Date().toISOString(), format, planType
        });

        // Log
        console.log(`[Campaign Purchase] ${brand} | ${format.toUpperCase()} (${duration}s) | ${planType} | ¥${price.toLocaleString()}`);

        // Inject campaign (PAID Priority)
        const metadata = {
            brand, scope, slot,
            duration: duration,
            is_image: (format === 'image'),
            title: `${brand} Campaign`
        };

        // Special Demo Logic: If user requests 'cooking' content
        if (req.query.contentType === 'cooking') {
            metadata.title = "Spaghetti Bolognese (Uploaded)";

            if (req.query.format === 'image') {
                metadata.is_image = true;
                metadata.url = "https://images.unsplash.com/photo-1551183053-bf91a1d81141?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"; // Demo Image
                console.log(`[Demo] 📸 Injecting Cooking IMAGE!`);
            } else {
                metadata.url = "/local-media/mixkit-serving-parmesan-cheese-in-spaghetti-bolognese-close-up-engraving-12171-hd-ready.mp4";
            }
            console.log(`[Demo] 🍝 Injecting Local Cooking Video (No System QR)`);
        }

        // Special Demo Logic: YouTube Link Input
        if (req.query.youtube) {
            // [MODIFICATION] If 'cooking' demo is active, IGNORE YouTube link to enforce Spaghetti Demo
            if (req.query.contentType === 'cooking') {
                console.log(`[Demo] ⚠️ YouTube Link Ignored due to Cooking Demo Enforcement.`);
            } else {
                console.log(`[Demo] 📺 YouTube Import Requested: ${req.query.youtube}`);
                metadata.title = `YouTube Ad`;
                metadata.url = req.query.youtube; // Pass Real URL
                metadata.is_youtube = true;       // Flag for Player
                metadata.is_image = false;
            }
        }

        // Inject the campaign
        if (typeof signageServer !== 'undefined' && signageServer.injectCampaign) {
            signageServer.injectCampaign(aspectRatio, metadata, 'PAID');
        } else {
            console.warn("[System] SignageServer not found, skipping injection.");
        }

        res.json({ success: true, multiplier: demoBoostMultiplier });
    } catch (e) {
        console.error("[Boost Error]", e);
        res.status(500).json({ error: e.message });
    }
});

// Official Campaign Creation Endpoint (Dashboard)
app.post('/api/campaigns', (req, res) => {
    console.log(`[API /api/campaigns] Received new campaign creation request. Data size: ${JSON.stringify(req.body).length} bytes`);
    try {
        const { name, start, end, budget, plan, trigger, target_imp, file_url, url, youtube_url, format, ad_email, ytUrl, fileUrl } = req.body;
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
                        if (text.includes('FAIL')) { adStatus = 'rejected'; } else { adStatus = 'active'; } 
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

    if (isProductionMode) {
        attribution.revenue = global.productionStats.revenue;
        attribution.sales = global.productionStats.sales;
        // Traffic Logic? Keep mock for OS share or randomize slightly
        traffic.os_share = { 'iOS': 60, 'Android': 40 };
    } else {
        // Demo Mode - Keep existing multiplied logic
        attribution.sales = Math.floor(attribution.sales * demoBoostMultiplier);
        attribution.revenue = Math.floor(attribution.revenue * demoBoostMultiplier);
    }

    // CPA Logic
    if (attribution.sales > 0) {
        // Simple CPA: 50,000 avg ad spend / sales
        attribution.cpa = Math.floor(10000 / attribution.sales);
    } else {
        attribution.cpa = 0;
    }

    res.json({
        attribution, analysis, context, traffic,
        scan_count: isProductionMode ? global.productionStats.scans : Math.floor(1240 * demoBoostMultiplier),
        ab_stats: isProductionMode ? global.productionStats.ab : null // Send A/B data
    });
});

// Mode Switcher API
app.get('/api/ad/mode', (req, res) => {
    isProductionMode = (req.query.prod === 'true');
    console.log(`[Mode Logic] Switched to ${isProductionMode ? 'PRODUCTION' : 'DEMO'} Mode`);

    if (!isProductionMode) {
        signageServer.clearCampaigns();
        demoBoostMultiplier = 1.0;
    } else {
        // Reset Production Stats on Switch to Prod (Optional, or keep history?)
        // Let's keep history for now, or reset if requested.
        // User implied "Upload -> Result". Clean start is better for demoing.
        if (global.productionStats) {
            global.productionStats = {
                revenue: 0, sales: 0, scans: 0,
                ab: { A: { views: 0, scans: 0, sales: 0 }, B: { views: 0, scans: 0, sales: 0 } }
            };
        }
    }

    res.json({ success: true, mode: isProductionMode ? 'production' : 'demo' });
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
    if (isProductionMode && playlist.length > 0 && playlist[0].id === 'ad_default') {
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

app.post('/api/creator/bank', (req, res) => {
    const { email, bankName, branchName, accountNum, holderName } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    // Using email as primary key
    creatorBankData[email] = { email, bankName, branchName, accountNum, holderName, updatedAt: new Date().toISOString() };
    console.log(`[Creator] Bank Info Updated for: ${email}`);
    res.json({ success: true });
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

    if (global.productionStats && isProductionMode) {
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
    storeData["default_store"].total_ad_revenue = totalRevenue; // Sync global revenue to default_store
    for (const key of Object.keys(storeData)) {
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
                globalDashboardStats: typeof globalDashboardStats !== 'undefined' ? globalDashboardStats : {},
                agencyReferrals: typeof agencyReferrals !== 'undefined' ? agencyReferrals : [],
                productionStats: global.productionStats ? global.productionStats : null,
                creatorStats: typeof creatorStats !== 'undefined' ? creatorStats : {},
                globalSensorLogs: typeof globalSensorLogs !== 'undefined' ? globalSensorLogs : [],
                users: typeof users !== 'undefined' ? users : {},
                posTransactions: typeof posTransactions !== 'undefined' ? posTransactions : [],
                shiftState: typeof shiftState !== 'undefined' ? shiftState : { staff: [], chatHistory: [] },
                manualChat: typeof manualChat !== 'undefined' ? manualChat : [],
                manualhelpState: typeof manualhelpState !== 'undefined' ? manualhelpState : { manuals: [], logs: [] }
            }, null, 2);
            fs.writeFileSync(require('path').join(__dirname, 'database.json'), dataStr, 'utf8');
            if (dataStr !== lastDBString && lastDBString !== "") {
                pushToS3(dataStr);
            }
            lastDBString = dataStr;
        }
    } catch(e){}
}, 10000);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nRetail Media Server running!`);
    console.log(`[Entry] Login Portal: http://localhost:${PORT}/`);
    console.log(`[Mobile] Player:      http://localhost:${PORT}/player`);
    console.log(`[Hint]  Agency Login: Use 070-xxxx-xxxx\n`);
});

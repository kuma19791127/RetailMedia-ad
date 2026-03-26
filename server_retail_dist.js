const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
try { require('dotenv').config(); } catch (e) { console.log('[System] dotenv module not found, skipping.'); }

const fs = require('fs');

const adEngine = require('./ad_engine');
const signageServer = require('./signage_server');
const gmoPayment = require('./gmo_payment');

const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '500mb' })); // Allow large file uploads (Base64)
app.use(express.urlencoded({ limit: '500mb', extended: true }));
express.static.mime.define({ 'video/quicktime': ['mov'] });
app.use(express.static(__dirname)); // Serve root files
app.use('/assets', express.static(path.join(__dirname, 'assets'))); // Serve assets explicitly
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve transcoded video files

app.use('/assets', express.static(path.join(__dirname, 'assets')));

// State
const LOCAL_MEDIA_PATH = path.join(os.homedir(), 'Desktop', 'aaa');
if (require('fs').existsSync(LOCAL_MEDIA_PATH)) {
    app.use('/local-media', express.static(LOCAL_MEDIA_PATH));
    console.log(`[System] Serving Local Media from: ${LOCAL_MEDIA_PATH}`);
} else {
    console.log(`[System] Local Media folder not found at: ${LOCAL_MEDIA_PATH}`);
}

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
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'login_portal.html')));

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
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'Anti-Gravity.html')));

// Legacy Routes (Redirect to Portal)
app.get('/store-owner', (req, res) => res.redirect('/store-portal'));
app.get('/ai-studio', (req, res) => res.redirect('/store-portal'));
// Privacy Policy
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'privacy_policy.html')));

// --- CREATOR API ---
app.get('/api/creator/stats', (req, res) => {
    // Generate some random growth just to show it's live
    CREATOR_STATE.videos.forEach(v => {
        if (v.status === 'active') {
            const add = Math.floor(Math.random() * 5);
            v.views += add;
            v.revenue += add * 0.5;
        }
    });
    CREATOR_STATE.total_views = CREATOR_STATE.videos.filter(v => v.status === 'active').reduce((acc, v) => acc + v.views, 0);
    CREATOR_STATE.total_revenue = CREATOR_STATE.videos.filter(v => v.status === 'active').reduce((acc, v) => acc + v.revenue, 0);

    res.json(CREATOR_STATE);
});

app.post('/api/creator/upload', (req, res) => {
    const { title, src, format } = req.body;
    const newId = Date.now();
    const newVideo = {
        id: newId,
        title: title || "究極の卵かけご飯",
        format: format || "縦型 (Shorts)",
        views: 1000, revenue: 500, status: 'active',
        attention: 92, skip: 2, uplift: 25, rank: 'S', color: '#f1c40f'
    };
    CREATOR_STATE.videos.unshift(newVideo);

    const finishUpload = (finalUrl) => {
        // Auto-inject into signage player (as PAID or IMPRESSION so it shows up)
        const adData = {
            id: `creator_${newId}`,
            title: `Creator: ${newVideo.title}`,
            url: finalUrl,
            duration: 45,
            brand: "Creator",
            youtube_url: finalUrl.includes('youtu') ? finalUrl : null
        };
        signageServer.injectCampaign('9:16', adData, 'INTERRUPT'); // Inject as INTERRUPT for immediate demo playback
        console.log(`[Creator] Video Uploaded & Linked to Signage: ${adData.title}`);

        // Broadcast reload event to all signage players
        broadcastEvent({ type: 'force_reload' });
        res.json({ success: true, video: newVideo, finalUrl: finalUrl });
    };

    if (src && src.startsWith('data:video/quicktime;base64,')) {
        console.log("[Creator] Detected .mov file, transcoding to .mp4...");
        const base64Data = src.split(';base64,').pop();
        const inputPath = path.join(__dirname, 'uploads', `temp_${newId}.mov`);


        const outputPath = path.join(__dirname, 'uploads', `video_${newId}.mp4`);
        fs.writeFileSync(inputPath, base64Data, { encoding: 'base64' });

        ffmpeg(inputPath)
            .output(outputPath)
            .videoCodec('libx264')
            .addOption('-preset', 'fast')
            .on('end', () => {
                console.log("[Creator] Transcoding finished.");
                fs.unlinkSync(inputPath); // Clean up temp mov file
                finishUpload(`/uploads/video_${newId}.mp4`);
            })
            .on('error', (err) => {
                console.error("[Creator] Transcoding error:", err);
                finishUpload(src); // Fallback to original just in case
            })
            .run();
    } else if (src && src.startsWith('data:')) {
        // Save MP4 or Image to disk to prevent massive base64 broadcast
        console.log("[Creator] Saving media file to disk...");
        const ext = src.split(';')[0].split('/')[1] === 'mp4' ? 'mp4' : 'media';
        const base64Data = src.split(';base64,').pop();
        const outputPath = path.join(__dirname, 'uploads', `video_${newId}.${ext}`);
        fs.writeFileSync(outputPath, base64Data, { encoding: 'base64' });
        finishUpload(`/uploads/video_${newId}.${ext}`);
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
        const customFetch = globalThis.fetch || (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        const crypto = require('crypto');
        
        // Execute Actual Production Charge via Square API
        const idempotencyKey = crypto.randomUUID();
        const squareRes = await customFetch('https://connect.squareup.com/v2/payments', {
            method: 'POST',
            headers: {
                'Square-Version': '2024-03-20',
                'Authorization': `Bearer EAAAl-EUOJH3OJ55TOYSKXE1PLH2_uqcQwWo18xxf-bvS2CeNVJI0ETQ8nXsKs7z`,
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
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    const user = users[email];
    if (user && user.password === password) {
        console.log(`[Auth] ✅ Login Success: ${email}`);
        currentUser = { email, role: user.role }; // Set Session
        res.json({ success: true, redirect: getRedirectUrl(user.role) });
    } else {
        console.log(`[Auth] ❌ Login Failed: ${email}`);
        res.json({ success: false, error: "Invalid Email or Password" });
    }
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


app.get('/api/admin/dashboard', (req, res) => {
    // Return mock billing and payout data for the admin portal
    const retailAdRevenue = CREATOR_STATE.total_revenue * 1.5;
    const adsenseRevenue = 45000;
    const agencyCommission = Math.floor(retailAdRevenue * 0.2); // 20%
    const creatorReward = Math.floor(CREATOR_STATE.total_revenue + (adsenseRevenue * 0.1) + 10000); // 10% + cm bonus
    const operatingCost = 30000;
    const totalNetRevenue = retailAdRevenue + adsenseRevenue - agencyCommission - creatorReward - operatingCost;
    const adRevenueShare = Math.floor(totalNetRevenue * 0.5);

    res.json({
        success: true,
        accounting_email: "admin-accounting@anywhere-regi.com",
        billing: [
            { id: "STORE_001", name: "本店スーパー", sales: 15400000, fee_1_2_percent: 184800, email: "store@demo.com", status: "未請求" }
        ],
        payouts: [
            {
                id: "STORE_001", name: "本店スーパー",
                retail_ad_revenue: retailAdRevenue,
                adsense_revenue: adsenseRevenue,
                agency_commission: agencyCommission,
                creator_reward: creatorReward,
                operating_cost: operatingCost,
                total_net_revenue: totalNetRevenue,
                ad_revenue_share: adRevenueShare,
                email: "store@demo.com",
                status: "未払",
                bank_info: { bank: "みずほ銀行", account: "普通 1234567" }
            }
        ]
    });
});

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
    try {
        const { name, start, end, budget, plan, trigger, target_imp, file_url, url, youtube_url, format, ad_email } = req.body;
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

        const processAndInject = (finalUrl) => {
            const metadata = {
                title: name,
                format: format, // Pass format (image/video/youtube)
                // Prioritize passed URL (Base64) or YouTube URL. DO NOT default to Sintel anymore.
                url: finalUrl,
                youtube_url: finalUrl && finalUrl.includes('youtu') ? finalUrl : youtube_url,
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

        if (rawUrl.startsWith('data:video/quicktime;base64,')) {
            console.log("[AdUpload] Detected .mov file, transcoding to .mp4...");
            const base64Data = rawUrl.split(';base64,').pop();
            const tempId = Date.now();
            const inputPath = path.join(__dirname, 'uploads', `ad_temp_${tempId}.mov`);
            const outputPath = path.join(__dirname, 'uploads', `ad_video_${tempId}.mp4`);
            fs.writeFileSync(inputPath, base64Data, { encoding: 'base64' });

            ffmpeg(inputPath)
                .output(outputPath)
                .videoCodec('libx264')
                .addOption('-preset', 'fast')
                .on('end', () => {
                    console.log("[AdUpload] Transcoding finished.");
                    fs.unlinkSync(inputPath); // Clean up temp mov file
                    processAndInject(`/uploads/ad_video_${tempId}.mp4`);
                    // We must wait to broadcast or return. Because Express prefers sync response,
                    // we returned "Campaign Created" below before finish, but that's fine.
                    if (typeof broadcastEvent === 'function') broadcastEvent({ type: 'force_reload' });
                })
                .on('error', (err) => {
                    console.error("[AdUpload] Transcoding error:", err);
                    processAndInject(rawUrl); // Fallback
                    if (typeof broadcastEvent === 'function') broadcastEvent({ type: 'force_reload' });
                })
                .run();

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

    // Add some history/mock if list is empty for demo purpose
    if (list.length === 0) {
        list.push({ status: 'ended', name: 'Spring Sale 2025', plan: 'cpm', start: '2025-04-01', end: '2025-04-30', budget: 10000, spend: 10000, imp: 10000 });
    }

    res.json(list);
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

        // Inject into Playlist logic
        // We simulate a metadata object similar to demo boost
        const metadata = {
            id: `upload-${Date.now()}`,
            title: 'Uploaded Ad',
            url: `/local-media/${filename}`,
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
    const { text, speed, voiceEngine } = req.body;
    if (!text) return res.status(400).json({ error: "Text required" });

    try {
        console.log(`[TTS] Requesting TTS (${voiceEngine || 'default'})...`);
        const stylePrompt = req.body.stylePrompt || "元気な感じ";
        const keyPath = "C:\\Users\\one\\Desktop\\RetailMedia_System\\my-project-89579lifeai-de780f052f58.json";

        // === Vertex AI Gemini 2.5 Flash TTS ===
        if (voiceEngine && voiceEngine.startsWith('gemini_')) {
            const parts = voiceEngine.split('_');
            let geminiVoiceName = 'Aoede'; // Default Vertex voice
            if (parts.length >= 2 && parts[1] !== 'flash') {
                // Capitalize first letter: "achernar" -> "Achernar"
                geminiVoiceName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
            } else if (parts[1] === 'flash') {
                geminiVoiceName = 'Aoede';
            }

            console.log(`[TTS Vertex] Using Gemini 2.5 Flash Voice: ${geminiVoiceName}`);

            try {
                const { GoogleAuth } = require('google-auth-library');
                const auth = new GoogleAuth({
                    keyFilename: keyPath,
                    scopes: ['https://www.googleapis.com/auth/cloud-platform']
                });
                const client = await auth.getClient();
                const tokenInfo = await client.getAccessToken();

                const url = 'https://us-central1-aiplatform.googleapis.com/v1beta1/projects/my-project-89579lifeai/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent';

                // Instruct Gemini on how to speak
                const finalPrompt = stylePrompt ? `以下のテキストを「${stylePrompt}」という感情やテンションで、自然な抑揚をつけて読み上げてください。\n\nテキスト: ${text}` : text;

                const body = {
                    contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
                    generationConfig: {
                        responseModalities: ['AUDIO'],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: {
                                    voiceName: geminiVoiceName
                                }
                            }
                        }
                    }
                };

                const apiRes = await globalThis.fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + tokenInfo.token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });
                const data = await apiRes.json();

                if (data.candidates && data.candidates[0].content.parts) {
                    const audioPart = data.candidates[0].content.parts.find(p => p.inlineData && p.inlineData.data);
                    if (audioPart) {
                        return res.json({ audioContent: audioPart.inlineData.data });
                    }
                }
                console.warn("[TTS Vertex Warning] No audio returned (possibly not allowlisted). Falling back to Cloud TTS. Data:", JSON.stringify(data));
                // Fallthrough to standard Cloud TTS
            } catch (err) {
                console.warn("[TTS Vertex Exception] Falling back to Cloud TTS. Error:", err.message);
                // Fallthrough to standard Cloud TTS
            }
        }

        // === Standard Google Cloud TTS (Fallback/Neural2) ===
        console.log(`[TTS Cloud] Using Standard Google Cloud TTS: ${voiceEngine}`);
        let voiceName = 'ja-JP-Neural2-B'; // Default (Female)
        let ssmlGender = 'FEMALE';

        if (voiceEngine === 'api_neural_male') {
            voiceName = 'ja-JP-Neural2-C';
            ssmlGender = 'MALE';
        }

        // Initialize SDK client lazily
        if (!TextToSpeechClient) {
            try {
                const textToSpeech = require('@google-cloud/text-to-speech');
                const fs = require('fs');
                let clientOptions = {};
                if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(keyPath)) {
                    clientOptions = { keyFilename: keyPath };
                }
                TextToSpeechClient = new textToSpeech.TextToSpeechClient(clientOptions);
            } catch (e) {
                console.error("[TTS Error] Failed to initialize Google TTS SDK:", e);
                return res.status(500).json({ error: "Failed to initialize Google TTS SDK. " + e.message });
            }
        }

        const request = {
            input: { text: text },
            voice: { languageCode: 'ja-JP', name: voiceName, ssmlGender: ssmlGender },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: parseFloat(speed || 1.0),
                pitch: parseFloat(req.body.pitch || 0.0)
            },
        };

        const [response] = await TextToSpeechClient.synthesizeSpeech(request);
        const base64Audio = response.audioContent.toString('base64');
        res.json({ audioContent: base64Audio });

    } catch (e) {
        console.error("[TTS Proxy Error]", e.details || e.message);
        res.status(500).json({ error: (e.details || e.message) });
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
        traffic.os_share = { "iOS": 60 + Math.floor(Math.random() * 10), "Android": 30 + Math.floor(Math.random() * 10) };
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

// --- AGENCY REFERRAL DATA STORE ---
let agencyReferrals = [];

app.post('/api/admin/agency-submit', express.json(), (req, res) => {
    agencyReferrals.push({
        date: req.body.date,
        agency: req.body.agency,
        advertise: req.body.advertise,
        price: parseInt(req.body.price),
        status: 'Pending'
    });
    console.log(`[Agency] New Referral submitted by ${req.body.agency} for budget ¥${req.body.price}`);
    res.json({ success: true });
});

app.get('/api/admin/agency', (req, res) => {
    res.json(agencyReferrals);
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
app.post('/api/admin/creators/send-email', (req, res) => {
    const { to, amount } = req.body;

    console.log(`\n========================================`);
    console.log(`📧 AUTOMATIC EMAIL SENT (Payout)`);
    console.log(`To: ${to}`);
    console.log(`Subject: 【retail-ad】今月の広告収益振込予定のお知らせ`);
    console.log(`Body: 
    クリエイター様
    
    今月の広告収益額が確定いたしました。
    
    【振込予定額】: ¥${amount.toLocaleString()}
    【振込予定日】: 翌月末日
    【振込先】: 登録済みの銀行口座
    
    引き続き、素晴らしい動画のご投稿をお待ちしております。
    ========================================\n`);

    res.json({ success: true, message: "Email triggered successfully" });
});

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
    if (Math.random() < 0.35) globalDashboardStats.faceDetected++;

    res.json({ success: true, recorded, status: creatorStats[adId] ? creatorStats[adId].status : 'unknown' });
});

// GET Global Dashboard Analytics
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
    accounting_email: "admin-accounting@anywhere-regi.com"
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
    const s = storeData["default_store"];

    // Prepare Billing Data (Receivable: 1.2% of POS Sales)
    // If 0, mock a realistic number for demo
    const displayPosSales = s.total_pos_sales > 0 ? s.total_pos_sales : 12500000;
    const billingAmount = Math.floor(displayPosSales * 0.012);

    // Prepare Payout Data (Payable: 50% of Ad Revenue)
    const retailAdRevenue = totalRevenue > 0 ? totalRevenue : 3000000;
    const creatorReward = Math.floor(retailAdRevenue * 0.1); // 10% to creators
    const adsenseRevenue = 850000; // Mock Google AdSense Revenue
    const pureTotalRevenue = (retailAdRevenue - creatorReward) + adsenseRevenue;
    const shareAmount = Math.floor(pureTotalRevenue * 0.5);

    res.json({
        accounting_email: adminSettings.accounting_email,
        billing: [{
            id: s.id,
            name: s.name,
            sales: displayPosSales,
            fee_1_2_percent: billingAmount,
            email: s.billing_email,
            status: 'Pending'
        }],
        payouts: [{
            id: s.id,
            name: s.name,
            retail_ad_revenue: retailAdRevenue,
            creator_reward: creatorReward,
            adsense_revenue: adsenseRevenue,
            total_net_revenue: pureTotalRevenue,
            ad_revenue_share: shareAmount,
            bank_info: s.bank_info,
            status: 'Unpaid',
            email: s.billing_email || "store@example.com"
        }]
    });
});

// Mock Send Email (Simulating PDF & Japanese Content)
app.post('/api/admin/billing/send-email', (req, res) => {
    const { to, amount } = req.body;
    const sender = "admin-accounting@anywhere-regi.retail-ad.com";
    const dateStr = new Date().toISOString().split('T')[0];
    
    // Simulate Calculation Logic (1.2% fee)
    const systemFee = Number(amount);
    const posSales = Math.round(systemFee / 0.012);

    console.log(`\n=== 📧 AUTOMATIC INVOICE EMAIL ===`);
    console.log(`From:    ${sender}`);
    console.log(`To:      ${to}`);
    console.log(`Subject: どこでもレジシステム利用料 請求書 (${dateStr})`);
    console.log(`Body:`);
    console.log(`   ${to} 様`);
    console.log(`   今月のどこでもレジご利用明細をお送りします。`);
    console.log(`   --------------------------------`);
    console.log(`   [計算ロジック]`);
    console.log(`   当月POS決済総額: ¥${posSales.toLocaleString()}`);
    console.log(`   システム利用料率: 1.2%`);
    console.log(`   --------------------------------`);
    console.log(`   ご請求金額: ¥${systemFee.toLocaleString()}`);
    console.log(`   --------------------------------`);
    console.log(`[System] 📎 Generated PDF Attachment: Invoice_${dateStr}.pdf ... [OK]`);
    console.log(`==================================\n`);

    res.json({ success: true });
});

// Mock Send Email for Creators and Stores (Payouts)
app.post('/api/admin/creators/send-email', (req, res) => {
    const { to, amount, type } = req.body;
    const dateStr = new Date().toISOString().split('T')[0];
    const payoutAmount = Number(amount);
    
    let sender = "admin-accounting@creator.retail-ad.com";
    let subject = `リテアド・クリエイター報酬支払通知書 (${dateStr})`;
    
    // Simulate Creator Calculation (2 yen per view)
    const playCount = Math.round(payoutAmount / 2);

    if (type === 'store_payout') {
        sender = "admin-accounting@ad.retail-ad.com";
        subject = `広告収益・AdSense収益 実質支払通知書 (${dateStr})`;
        
        // Simulate Store Payout Calculation
        const totalNet = payoutAmount * 2; // 50% share
        const estimatedAdSense = Math.round(totalNet * 0.2);
        const estimatedAdRev = Math.round(totalNet * 1.2);
        const agencyFee = Math.round(estimatedAdRev * 0.2);
        const creatorReward = Math.round(estimatedAdRev * 0.1);
        
        console.log(`\n=== 📧 AUTOMATIC PAYOUT EMAIL (STORE) ===`);
        console.log(`From:    ${sender}`);
        console.log(`To:      ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body:`);
        console.log(`   ${to} 様`);
        console.log(`   今月の店舗サイネージにおける広告収益・AdSense収益の分配明細をお送りします。`);
        console.log(`   --------------------------------`);
        console.log(`   [計算ロジック]`);
        console.log(`   リテアド収益: ¥${estimatedAdRev.toLocaleString()}`);
        console.log(`   AdSense収益: ¥${estimatedAdSense.toLocaleString()}`);
        console.log(`   代理店コミッション(20%段抜): -¥${agencyFee.toLocaleString()}`);
        console.log(`   クリエイター報酬他(10%段抜): -¥${creatorReward.toLocaleString()}`);
        console.log(`   --------------------------------`);
        console.log(`   差引純売上: ¥${totalNet.toLocaleString()}`);
        console.log(`   店舗分配率: 50%`);
        console.log(`   --------------------------------`);
        console.log(`   お支払予定金額: ¥${payoutAmount.toLocaleString()}`);
        console.log(`   --------------------------------`);
        console.log(`[System] 📎 Generated PDF Attachment: Store_Payout_${dateStr}.pdf ... [OK]`);
        console.log(`==================================\n`);
    } else {
        console.log(`\n=== 📧 AUTOMATIC PAYOUT EMAIL (CREATOR) ===`);
        console.log(`From:    ${sender}`);
        console.log(`To:      ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body:`);
        console.log(`   ${to} 様`);
        console.log(`   今月のリテアド動画配信による報酬明細をお送りします。`);
        console.log(`   --------------------------------`);
        console.log(`   [計算ロジック]`);
        console.log(`   月間有効再生数: ${playCount.toLocaleString()} 回`);
        console.log(`   ベース再生単価: ¥2 / 回`);
        console.log(`   --------------------------------`);
        console.log(`   お支払予定金額: ¥${payoutAmount.toLocaleString()}`);
        console.log(`   --------------------------------`);
        console.log(`[System] 📎 Generated PDF Attachment: Creator_Statement_${dateStr}.pdf ... [OK]`);
        console.log(`==================================\n`);
    }

    res.json({ success: true });
});

// Square SSoT Validation Endpoint
app.get('/api/admin/system/validate-square', (req, res) => {
    // In a real scenario, this would call Square's ListTransactions/ListPayments API
    // and sum the accepted payments, then compare to our local `totalRevenue` & `total_pos_sales`.
    
    const localAd = totalRevenue > 0 ? totalRevenue : 3000000;
    const localPos = storeData["default_store"].total_pos_sales > 0 ? storeData["default_store"].total_pos_sales : 12500000;
    
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
    const sales = s.total_pos_sales > 0 ? s.total_pos_sales : 12500000;
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

app.get('/api/ad/analytics', async (req, res) => {
    const lat = req.query.lat;
    const lon = req.query.lon;
    const region = req.query.region || 'Tokyo';

    // Ad_engine returns full context structure defined in ad_engine.js calculateContext
    try {
        const engineCtx = await adEngine.analyzeContext(region, lat, lon);
        res.json({
            context: engineCtx,
            attribution: { revenue: Math.floor(totalRevenue), cpa: 450 }
        });
    } catch (e) {
        res.status(500).json({ error: "Context AI Failed" });
    }
});


app.get('/api/campaigns', (req, res) => {
    res.json(campaigns);
});

app.get('/api/store/revenue', (req, res) => {
    res.json({
        success: true,
        adnet: Math.floor(totalRevenue), // Real accumulated revenue
        adsense: Math.floor(totalRevenue * 1.5), // Simulated AdSense proxy for now based on actual views
        unitA: Math.floor(totalRevenue * 1.5 * 0.65), // Simulated distribution
        unitB: Math.floor(totalRevenue * 1.5 * 0.35)
    });
});

app.post('/api/campaigns', (req, res) => {
    try {
        const newCp = {
            id: Date.now(),
            name: req.body.name,
            start: req.body.start,
            end: req.body.end,
            budget: parseInt(req.body.budget) || 0,
            spend: 0,
            imp: 0,
            status: "pending"
        };
        campaigns.unshift(newCp);
        console.log(`[Campaign] Created: ${newCp.name} (Budget: ¥${newCp.budget})`);
        res.json({ success: true, campaign: newCp });
    } catch (e) {
        console.error("Campaign Create Error", e);
        res.status(500).json({ error: "Failed to create campaign" });
    }
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

// Signage Playlist API (Connects Player to CMS)
app.get('/api/signage/playlist', (req, res) => {
    const loc = req.query.location || 'register_side';
    const requestStoreId = req.query.storeId; // Store ID from Player (e.g. STORE_001)

    // Pass Production Mode flag AND Store ID to Signage Server
    const playlist = signageServer.getPlaylist(loc, isProductionMode, requestStoreId);

    // --- Revenue Calculation for Ad Network ---
    // If programmatic ad is served, credit the store revenue.
    if (playlist && playlist.length > 0) {
        const item = playlist[0];
        if (item.is_network && item.cpm) {
            // Calculate per-view revenue (CPM / 1000)
            const revenuePerView = item.cpm / 1000;

            // Add to Global Revenue (shared with store)
            totalRevenue += revenuePerView;

            // Optional: Log revenue event occasionally
            if (Math.random() < 0.05) {
                console.log(`[Revenue] 💰 AdNet View: +¥${revenuePerView.toFixed(2)} (Total: ¥${Math.floor(totalRevenue)})`);
            }
        }
    }

    res.json(playlist);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\nRetail Media Server running!`);
    console.log(`[Entry] Login Portal: http://localhost:${PORT}/`);
    console.log(`[Mobile] Player:      http://localhost:${PORT}/player`);
    console.log(`[Hint]  Agency Login: Use 070-xxxx-xxxx\n`);
});

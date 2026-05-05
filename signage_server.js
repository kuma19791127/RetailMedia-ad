// Signage Server (Mock CMS with Ad Network Integration)
// 店舗のサイネージ端末に「何を流すか」を指示するサーバー

// State: Track contents separately
let STATE = {
    "register_side": {
        interrupt: null, // 🔥 Priority 1: Emergency/Voice Broadcast
        paid: [],      // 💰 Priority 2: Paid Ads (High CPM)
        moment: null,    // ☔ Priority 3a: Moment Delivery (Contextual)
        impression: null,// 📈 Priority 3b: Impression Delivery (Guaranteed)
        network: null,   // 🌐 Priority 4: Ad Network (Backfill)

        default: [] // Empty default as requested (No animation)
    }
};

// Simulated Context (Live Sensors)
let CONTEXT = {
    weather: 'rain', // Demo: It's raining
    temp: 24,
    people_count: 12
};

module.exports = {
getPlaylist: (locationId, isProduction = false, requestStoreId = null) => {
        const state = STATE["register_side"];

        // --- Priority 1: Emergency / Voice Interrupt (Targeted) ---
        if (state.interrupt) {
            const targetStore = state.interrupt.target_store_id;
            if (targetStore) {
                if (targetStore === requestStoreId) {
                    console.log(`[CMS] ⚡ MATCHED INTERRUPT for Store ${targetStore}: ${state.interrupt.title}`);
                    const broadcast = state.interrupt;
                    state.interrupt = null; // Consume
                    return [broadcast];
                }
            } else {
                console.log(`[CMS] ⚡ GLOBAL INTERRUPT Playing`);
                const broadcast = state.interrupt;
                state.interrupt = null;
                return [broadcast];
            }
        }

        // --- Combine uploaded ads and local desktop shorts into a loop ---
        const playlist = [];

        // 1. Add all uploaded active Paid/Creator ads
        if (Array.isArray(state.paid)) {
            for (const ad of state.paid) {
                if (ad.status === 'active') playlist.push(ad);
            }
        } else if (state.paid && state.paid.status === 'active') {
            playlist.push(state.paid);
        }

        // 2. Add active Moment / Impression ads
        if (state.moment && state.moment.status === 'active') playlist.push(state.moment);
        if (state.impression && state.impression.status === 'active') {
            const current = state.impression.current_imp || 0;
            const target = state.impression.target_imp || 1000;
            if (current < target) playlist.push(state.impression);
        }

        // 3. Scan project-relative base loop folder
        const fs = require('fs');
        const path = require('path');
        const desktopPath = path.join(__dirname, 'base_loop_videos');
        
        if (!global.cachedBaseVideos || Date.now() - (global.lastBaseVideoScan || 0) > 60000) {
            if (fs.existsSync(desktopPath)) {
                try {
                    const files = fs.readdirSync(desktopPath);
                    let baseVideos = [];
                    for (const f of files) {
                        if (f.toLowerCase().endsWith('.mp4') || f.toLowerCase().endsWith('.mov')) {
                            baseVideos.push({
                                id: `local_${f}`,
                                title: f,
                                url: `/desktop_shorts/${encodeURIComponent(f)}`,
                                aspect_ratio: '16:9',
                                status: 'active'
                            });
                        }
                    }
                    // Shuffle the array randomly
                    for (let i = baseVideos.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [baseVideos[i], baseVideos[j]] = [baseVideos[j], baseVideos[i]];
                    }
                    global.cachedBaseVideos = baseVideos;
                    global.lastBaseVideoScan = Date.now();
                } catch (e) {
                    console.error("[CMS] Error reading Desktop shorts:", e);
                }
            }
        }
        
        if (global.cachedBaseVideos) {
            playlist.push(...global.cachedBaseVideos);
        }
        
        // 4. Inject Retailer S3 Videos (Dynamic specific or ALL)
        if (global.retailer_videos) {
            for (const rv of global.retailer_videos) {
                if (rv.status !== 'active') continue;
                
                // Match Logic: Check if the video is meant for ALL stores, or just this specific chain, or this specific store
                const isMatch = (rv.target_store === 'ALL') || 
                                (requestStoreId && requestStoreId.startsWith(rv.retailer_prefix)) ||
                                (rv.target_store === requestStoreId);
                
                if (isMatch) {
                    playlist.push(rv);
                }
            }
        }

        if (playlist.length > 0) return playlist;
        return state.default;
    },

    // NEW: Record Impression from Beacon
    recordImpression: (adId) => {
        const state = STATE["register_side"];

        // 1. Check Impression Campaign
        if (state.impression && state.impression.id === adId) {
            state.impression.current_imp = (state.impression.current_imp || 0) + 1;
            console.log(`[Analytics] 📡 Beacon Received: Impression Counted (${state.impression.current_imp}/${state.impression.target_imp})`);
            return true;
        }

        // 2. Check Paid Campaign
        if (state.paid && state.paid.id === adId) {
            console.log(`[Analytics] 📡 Beacon Received: Paid Ad View (${state.paid.title})`);
            return true;
        }

        // 3. Network or others
        if (state.network && state.network.id === adId) {
            console.log(`[Analytics] 📡 Beacon Received: Network Ad View`);
            return true;
        }

        return false;
    },

    // NEW: Get All Active Campaigns for Dashboard
    getAllCampaigns: () => {
        const state = STATE["register_side"];
        const list = [];

        // Helper to push if exists
        const add = (item, defaultStatus) => {
            if (item) {
                list.push({
                    id: item.id,
                    name: item.title,
                    plan: item.plan_type || 'Custom',
                    status: item.status || 'active',
                    start: item.start_date || '2026-05-01',
                    end: item.end_date || '2026-05-31',
                    budget: item.budget || 0,
                    spend: Math.floor((item.budget || 0) * 0.45), // Mock spend
                    imp: item.current_imp || 0,
                    // Pass through all other metadata (targeting, format, etc)
                    ...item
                });
            }
        };

        add(state.paid, 'active');
        add(state.moment, 'active (moment)');
        add(state.impression, 'active (imp)');
        // interrupt is transient, maybe skip or show as 'urgent'

        return list;
    },

    updateCampaignStatus: (id, newStatus) => {
        const state = STATE["register_side"];
        let found = false;
        ['paid', 'moment', 'impression'].forEach(type => {
            if (state[type] && state[type].id === id) {
                state[type].status = newStatus;
                found = true;
            }
        });
        return found;
    },

    injectCampaign: (aspectRatio, metadata, type = 'PAID') => {
        // Construct Ad Object
        const newAd = {
            id: `ad_${Date.now()}`,
            title: metadata.title || metadata.name || "New Campaign",
            url: metadata.youtube_url || metadata.url || "",
            duration: metadata.duration || 45,
            aspect_ratio: aspectRatio,
            location_qr: metadata.location_qr || ("https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(metadata.brand)),
            is_youtube: !!( (metadata.youtube_url && !metadata.youtube_url.startsWith('data:')) || (metadata.url && !metadata.url.startsWith('data:') && (metadata.url.includes('youtube') || metadata.url.includes('youtu.be'))) ),
            is_image: (metadata.format === 'image') || (metadata.url && (/\.(jpg|jpeg|png|gif|webp)$/i.test(metadata.url) || metadata.url.startsWith('data:image/'))),
            is_recipe: !!metadata.ai_text,
            status: metadata.status || 'pending', // Default to pending for approval
            ...metadata
        };

        // Update appropriate slot based on TYPE
        if (type === 'INTERRUPT') {
            newAd.is_interrupt = true;
            newAd.status = 'active'; // Interruptions bypass approval
            STATE["register_side"].interrupt = newAd;
            console.log(`[CMS] ⚡⚡ INTERRUPT Injected: ${newAd.title}`);
        } else if (type === 'MOMENT') {
            newAd.trigger = { weather: 'rain' }; // Demo: Force trigger
            STATE["register_side"].moment = newAd;
            console.log(`[CMS] ☔ MOMENT Ad Injected: ${newAd.title}`);
        } else if (type === 'IMPRESSION') {
            newAd.target_imp = metadata.target_imp || 10000;
            newAd.current_imp = 0;
            STATE["register_side"].impression = newAd;
            console.log(`[CMS] 📈 IMPRESSION Ad Injected: ${newAd.title}`);
        } else {
            // Default to PAID (Priority 2)
            STATE["register_side"].paid = newAd;
            STATE["register_side"].network = null; // Reset network to allow premium ad
            console.log(`[CMS] 🔴 PAID Ad injected: ${newAd.title}`);
        }

        return newAd;
    },

    getState: () => STATE,
    setState: (newState) => { STATE = newState; },

    clearCampaigns: () => {
        STATE["register_side"].paid = null;
        STATE["register_side"].moment = null;
        STATE["register_side"].impression = null;
        STATE["register_side"].network = null;
        STATE["register_side"].interrupt = null;
        console.log(`[CMS] 🧹 Playlist Cleared`);
    }
};

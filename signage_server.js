// Signage Server (Mock CMS with Ad Network Integration)
// 店舗のサイネージ端末に「何を流すか」を指示するサーバー

// State: Track contents separately
let STATE = {
    "register_side": {
        interrupt: null, // 🔥 Priority 1: Emergency/Voice Broadcast
        paid: [],      // 💰 Priority 2: Paid Ads (High CPM)
        moment: [],    // ☔ Priority 3a: Moment Delivery (Contextual)
        impression: [],// 📈 Priority 3b: Impression Delivery (Guaranteed)
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

function isCampaignMatch(ad, requestStoreId, requestStoreOrg, requestStoreArea, requestStorePrefecture, requestStoreType) {
    const scope = ad.target_scope || 'enterprise';
    
    // 1. 全店舗配信 (all)
    if (scope === 'all') {
        return matchPrefectureAndStoreType(ad, requestStorePrefecture, requestStoreType);
    }
    
    // 2. エリア限定配信 (area)
    if (scope === 'area') {
        if (!requestStoreArea || !ad.target_areas) return false;
        const areas = ad.target_areas.split(',').map(a => a.trim());
        if (!areas.includes(requestStoreArea)) return false;
        return matchPrefectureAndStoreType(ad, requestStorePrefecture, requestStoreType);
    }
    
    // 3. 都道府県限定配信 (prefecture)
    if (scope === 'prefecture') {
        if (!requestStorePrefecture || !ad.target_prefectures) return false;
        const prefs = ad.target_prefectures.split(',').map(p => p.trim());
        if (!prefs.includes(requestStorePrefecture)) return false;
        return matchPrefectureAndStoreType(ad, requestStorePrefecture, requestStoreType);
    }
    
    // 4. 複数企業ジャック配信 (cross_enterprise)
    if (scope === 'cross_enterprise') {
        if (!requestStoreOrg || !ad.target_orgs) return false;
        const orgs = ad.target_orgs.split(',').map(o => o.trim());
        if (!orgs.includes(requestStoreOrg)) return false;
        return matchPrefectureAndStoreType(ad, requestStorePrefecture, requestStoreType);
    }
    
    // 5. 特定の単一企業/組織配信 (enterprise)
    if (scope === 'enterprise') {
        const isOrgMatch = !ad.target_org || ad.target_org === 'default_store' || ad.target_org === requestStoreOrg || ad.target_org === requestStoreId;
        if (!isOrgMatch) return false;
        return matchPrefectureAndStoreType(ad, requestStorePrefecture, requestStoreType);
    }
    
    return true;
}

function matchPrefectureAndStoreType(ad, requestStorePrefecture, requestStoreType) {
    // 都道府県指定チェック
    if (ad.target_prefectures) {
        if (!requestStorePrefecture) return false;
        const prefs = ad.target_prefectures.split(',').map(p => p.trim()).filter(Boolean);
        if (prefs.length > 0 && !prefs.includes(requestStorePrefecture)) return false;
    }
    // 店舗業態指定チェック
    if (ad.target_store_types) {
        if (!requestStoreType) return false;
        const types = ad.target_store_types.split(',').map(t => t.trim()).filter(Boolean);
        if (types.length > 0 && !types.includes(requestStoreType)) return false;
    }
    return true;
}

module.exports = {
    getPlaylist: (locationId, isProduction = false, requestStoreId = null, requestStoreOrg = null, requestStoreArea = null, requestStorePrefecture = null, requestStoreType = null) => {
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
                if (ad.status === 'active' && isCampaignMatch(ad, requestStoreId, requestStoreOrg, requestStoreArea, requestStorePrefecture, requestStoreType)) playlist.push(ad);
            }
        } else if (state.paid && state.paid.status === 'active' && isCampaignMatch(state.paid, requestStoreId, requestStoreOrg, requestStoreArea, requestStorePrefecture, requestStoreType)) {
            playlist.push(state.paid);
        }

        // 2. Add active Moment / Impression ads
        if (Array.isArray(state.moment)) {
            for (const ad of state.moment) {
                if (ad.status === 'active' && isCampaignMatch(ad, requestStoreId, requestStoreOrg, requestStoreArea, requestStorePrefecture, requestStoreType)) playlist.push(ad);
            }
        } else if (state.moment && state.moment.status === 'active' && isCampaignMatch(state.moment, requestStoreId, requestStoreOrg, requestStoreArea, requestStorePrefecture, requestStoreType)) {
            playlist.push(state.moment);
        }

        if (Array.isArray(state.impression)) {
            for (const ad of state.impression) {
                if (ad.status === 'active' && isCampaignMatch(ad, requestStoreId, requestStoreOrg, requestStoreArea, requestStorePrefecture, requestStoreType)) {
                    const current = ad.current_imp || 0;
                    const target = ad.target_imp || 1000;
                    if (current < target) playlist.push(ad);
                }
            }
        } else if (state.impression && state.impression.status === 'active' && isCampaignMatch(state.impression, requestStoreId, requestStoreOrg, requestStoreArea, requestStorePrefecture, requestStoreType)) {
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
            // Shuffle and cache for 60 seconds to support random delivery without breaking frontend polling
            if (!global.cachedRetailerVideos || Date.now() - (global.lastRetailerVideoShuffle || 0) > 60000 || global.retailer_videos.length !== global.cachedRetailerVideos.length) {
                let shuffledRV = [...global.retailer_videos];
                for (let i = shuffledRV.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffledRV[i], shuffledRV[j]] = [shuffledRV[j], shuffledRV[i]];
                }
                global.cachedRetailerVideos = shuffledRV;
                global.lastRetailerVideoShuffle = Date.now();
            }

            for (const rv of global.cachedRetailerVideos) {
                if (rv.status !== 'active') continue;
                
                // Match Logic: Check targeting scope and fallback to legacy logic
                let isMatch = isCampaignMatch(rv, requestStoreId, requestStoreOrg, requestStoreArea, requestStorePrefecture, requestStoreType);
                if (rv.target_scope === undefined) {
                    // Legacy Match fallback
                    isMatch = (rv.target_store === 'ALL') || 
                              (requestStoreId && requestStoreId.startsWith(rv.retailer_prefix)) ||
                              (rv.target_store === requestStoreId);
                }
                
                if (isMatch) {
                    playlist.push(rv);
                }
            }
        }

        // --- AI Match Engine Playlist Automation ---
        try {
            const adEngine = require('./ad_engine');
            const creators = playlist.filter(item => item.id && String(item.id).startsWith('creator_'));
            const ads = playlist.filter(item => item.id && String(item.id).startsWith('ad_') && item.status === 'active');
            const others = playlist.filter(item => !creators.includes(item) && !ads.includes(item));

            if (creators.length > 0 && ads.length > 0) {
                let matchedPairs = [];
                let usedCreators = new Set();
                let usedAds = new Set();

                // 1. マッチスコアを全ペアでスキャンして高親和性のペア抽出
                for (const video of creators) {
                    for (const ad of ads) {
                        const score = adEngine.calculateAdCreatorMatch(video, ad);
                        if (score >= 0.80) {
                            matchedPairs.push({ video, ad, score });
                        }
                    }
                }

                // スコアが高い順にソート
                matchedPairs.sort((a, b) => b.score - a.score);

                let optimizedPlaylist = [];
                let pairedItems = new Set();

                // 2. マッチしたペアをプレイリストに配置（80%以上連続配置、90%以上2倍ブースト）
                matchedPairs.forEach(pair => {
                    if (!usedCreators.has(pair.video.id) && !usedAds.has(pair.ad.id)) {
                        usedCreators.add(pair.video.id);
                        usedAds.add(pair.ad.id);

                        // 連続配置
                        optimizedPlaylist.push(pair.video);
                        optimizedPlaylist.push(pair.ad);

                        pairedItems.add(pair.video.id);
                        pairedItems.add(pair.ad.id);

                        // 90%以上は2倍露出ブースト
                        if (pair.score >= 0.90) {
                            optimizedPlaylist.push(pair.video);
                            optimizedPlaylist.push(pair.ad);
                            console.log(`[AI Match Playlist] Dynamic Boost applied (2x Exposure) for matched pair: Creator(${pair.video.title}) + Ad(${pair.ad.title}) with score ${pair.score}`);
                        } else {
                            console.log(`[AI Match Playlist] Sequential alignment applied for matched pair: Creator(${pair.video.title}) + Ad(${pair.ad.title}) with score ${pair.score}`);
                        }
                    }
                });

                // 3. ペアにならなかった残りのコンテンツを挿入
                creators.forEach(video => {
                    if (!pairedItems.has(video.id)) optimizedPlaylist.push(video);
                });
                ads.forEach(ad => {
                    if (!pairedItems.has(ad.id)) optimizedPlaylist.push(ad);
                });

                // 4. プレイリスト全体を再構築
                playlist.length = 0;
                playlist.push(...optimizedPlaylist, ...others);
            }
        } catch (matchErr) {
            console.error("[AI Match Playlist] Error during playlist optimization:", matchErr.message);
        }

        if (playlist.length > 0) return playlist;
        return state.default;
    },

    // NEW: Record Impression from Beacon
    recordImpression: (adId) => {
        const state = STATE["register_side"];

        // 1. Check Impression Campaign
        if (Array.isArray(state.impression)) {
            const foundAd = state.impression.find(ad => ad.id === adId);
            if (foundAd) {
                foundAd.current_imp = (foundAd.current_imp || 0) + 1;
                console.log(`[Analytics] 📡 Beacon Received: Impression Counted (${foundAd.current_imp}/${foundAd.target_imp})`);
                return true;
            }
        } else if (state.impression && state.impression.id === adId) {
            state.impression.current_imp = (state.impression.current_imp || 0) + 1;
            console.log(`[Analytics] 📡 Beacon Received: Impression Counted (${state.impression.current_imp}/${state.impression.target_imp})`);
            return true;
        }

        // 2. Check Paid Campaign
        if (Array.isArray(state.paid)) {
            const foundAd = state.paid.find(ad => ad.id === adId);
            if (foundAd) {
                console.log(`[Analytics] 📡 Beacon Received: Paid Ad View (${foundAd.title})`);
                return true;
            }
        } else if (state.paid && state.paid.id === adId) {
            console.log(`[Analytics] 📡 Beacon Received: Paid Ad View (${state.paid.title})`);
            return true;
        }

        // 3. Check Moment Campaign
        if (Array.isArray(state.moment)) {
            const foundAd = state.moment.find(ad => ad.id === adId);
            if (foundAd) {
                console.log(`[Analytics] 📡 Beacon Received: Moment Ad View (${foundAd.title})`);
                return true;
            }
        } else if (state.moment && state.moment.id === adId) {
            console.log(`[Analytics] 📡 Beacon Received: Moment Ad View (${state.moment.title})`);
            return true;
        }

        // 4. Network or others
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
            if (Array.isArray(item)) {
                item.forEach(sub => add(sub, defaultStatus));
                return;
            }
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
            if (Array.isArray(state[type])) {
                state[type].forEach(ad => {
                    if (ad.id === id) {
                        ad.status = newStatus;
                        found = true;
                    }
                });
            } else if (state[type] && state[type].id === id) {
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
            if (!Array.isArray(STATE["register_side"].moment)) {
                STATE["register_side"].moment = [];
            }
            const exists = STATE["register_side"].moment.some(ad => ad.id === newAd.id);
            if (!exists) {
                STATE["register_side"].moment.push(newAd);
            }
            console.log(`[CMS] ☔ MOMENT Ad Injected: ${newAd.title} (Total: ${STATE["register_side"].moment.length})`);
        } else if (type === 'IMPRESSION') {
            newAd.target_imp = metadata.target_imp || 10000;
            newAd.current_imp = 0;
            if (!Array.isArray(STATE["register_side"].impression)) {
                STATE["register_side"].impression = [];
            }
            const exists = STATE["register_side"].impression.some(ad => ad.id === newAd.id);
            if (!exists) {
                STATE["register_side"].impression.push(newAd);
            }
            console.log(`[CMS] 📈 IMPRESSION Ad Injected: ${newAd.title} (Total: ${STATE["register_side"].impression.length})`);
        } else {
            // Default to PAID (Priority 2)
            if (!Array.isArray(STATE["register_side"].paid)) {
                STATE["register_side"].paid = [];
            }
            // Avoid duplicate ID injection
            const exists = STATE["register_side"].paid.some(ad => ad.id === newAd.id);
            if (!exists) {
                STATE["register_side"].paid.push(newAd);
            }
            STATE["register_side"].network = null; // Reset network to allow premium ad
            console.log(`[CMS] 🔴 PAID Ad injected: ${newAd.title} (Total Paid in Loop: ${STATE["register_side"].paid.length})`);
        }

        return newAd;
    },

    getState: () => STATE,
    setState: (newState) => { STATE = newState; },

    clearCampaigns: () => {
        STATE["register_side"].paid = [];
        STATE["register_side"].moment = [];
        STATE["register_side"].impression = [];
        STATE["register_side"].network = null;
        STATE["register_side"].interrupt = null;
        console.log(`[CMS] 🧹 Playlist Cleared`);
    }
};

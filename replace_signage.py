import os
import re

filepath = 'c:/Users/one/Desktop/RetailMedia_System/signage_server.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Change STATE initialization for paid to be an array
content = re.sub(r'paid:\s*null,', 'paid: [],', content)

# 2. Change injectCampaign to push to paid array
inject_old = '''            } else {
                STATE["register_side"].paid = newAd;
            }'''
inject_new = '''            } else {
                if (!Array.isArray(STATE["register_side"].paid)) STATE["register_side"].paid = [];
                STATE["register_side"].paid.push(newAd);
            }'''
content = content.replace(inject_old, inject_new)

# 3. Rewrite getPlaylist completely
playlist_old = '''    getPlaylist: (locationId, isProduction = false, requestStoreId = null) => {
        const state = STATE["register_side"];

        // --- Priority 1: Emergency / Voice Interrupt (Targeted) ---
        if (state.interrupt) {
            const targetStore = state.interrupt.target_store_id;
            if (targetStore) {
                if (targetStore === requestStoreId) {
                    console.log(`[CMS] ⚡ MATCHED INTERRUPT for Store ${targetStore}: ${state.interrupt.title}`);
                    const broadcast = state.interrupt;
                    state.interrupt = null; // Consume (One-time play)
                    return [broadcast];
                }
            } else {
                console.log(`[CMS] ⚡ GLOBAL INTERRUPT Playing`);
                const broadcast = state.interrupt;
                state.interrupt = null;
                return [broadcast];
            }
        }

        // --- Priority 2: Paid Ads (Retail Media - Direct Sold) ---
        if (state.paid && state.paid.status === 'active') return [state.paid];

        // --- Priority 3: Moment & Impression (Smart Delivery) ---

        // 3a. Moment Delivery (Contextual)
        if (state.moment && state.moment.status === 'active') {
            // Demo Logic: If trigger matches context
            // Default trigger is weather='rain' for demo
            const trigger = state.moment.trigger || { weather: 'rain' };
            if (trigger.weather === CONTEXT.weather) {
                console.log(`[CMS] ☁️ MOMENT Matched (Rain): ${state.moment.title}`);
                return [state.moment];
            }
        }

        // 3b. Impression Delivery (Guaranteed)
        if (state.impression && state.impression.status === 'active') {
            const current = state.impression.current_imp || 0;
            const target = state.impression.target_imp || 1000;
            
            if (current < target) {
                // Just Schedule it. Do NOT increment here (wait for beacon)
                console.log(`[CMS] 📈 IMPRESSION Scheduled: ${current}/${target}`);
                return [state.impression];
            } else {
                console.log(`[CMS] ✂️ IMPRESSION Goal Met (Skipping): ${state.impression.title}`);
                // state.impression = null; // Optionally remove
            }
        }

        // --- Priority 4: Ad Network (Google AdSense/AdMob Mock) ---
        const isProductionMode = false; // Disabled auto demo ads as requested
        if (isProductionMode) {
            if (!state.network) {
                const networkAds = [
                    { title: "AdNet: Google Pixel (Demo)", url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", cpm: 150 },
                    { title: "AdNet: Travel Campaign (Demo)", url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", cpm: 80 },
                    { title: "AdNet: Chromecast (Demo)", url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", cpm: 120 },
                    { title: "AdNet: Global News (Demo)", url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4", cpm: 90 }
                ];
                const randomAd = networkAds[Math.floor(Math.random() * networkAds.length)];
                state.network = {
                    id: `net_${Date.now()}`,
                    title: randomAd.title,
                    url: randomAd.url,
                    duration: 15,
                    aspect_ratio: "16:9",
                    is_network: true,
                    cpm: randomAd.cpm,
                    location_qr: ""
                };
                console.log(`[AdNet] 🌐 外部ネットワーク広告を充填: ${state.network.title} (CPM: ¥${state.network.cpm})`);
            }
            return [state.network];
        }

        // --- Priority 5: Default Content (Filler) ---
        return state.default;
    },'''

playlist_new = '''    getPlaylist: (locationId, isProduction = false, requestStoreId = null) => {
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

        // 3. Scan local Desktop "広告ショート" folder
        const fs = require('fs');
        const path = require('path');
        const os = require('os');
        const desktopPath = path.join(os.homedir(), 'Desktop', '広告ショート');
        
        if (fs.existsSync(desktopPath)) {
            try {
                const files = fs.readdirSync(desktopPath);
                for (const f of files) {
                    if (f.toLowerCase().endsWith('.mp4') || f.toLowerCase().endsWith('.mov')) {
                        playlist.push({
                            id: `local_${f}`,
                            title: f,
                            url: `/desktop_shorts/${f}`,
                            aspect_ratio: '16:9',
                            status: 'active'
                        });
                    }
                }
            } catch (e) {
                console.error("[CMS] Error reading Desktop shorts:", e);
            }
        }

        if (playlist.length > 0) return playlist;
        return state.default;
    },'''

# Just to be safe, find the start and end of getPlaylist since it has unicode emojis that might mismatch.
import re
pattern = re.compile(r'    getPlaylist:.*?return state\.default;\n    \},', re.DOTALL)
content = pattern.sub(playlist_new.strip(), content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated signage_server.js")

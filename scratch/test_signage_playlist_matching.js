const assert = require('assert');
const signageServer = require('../signage_server');
const adEngine = require('../ad_engine');

console.log("=== Starting AI Playlist Matching Engine Automated Tests ===");

// 1. Initialize and clear campaigns
signageServer.clearCampaigns();

// 2. Prepare test data
// Video A: High relevance (Cooking beer-snack, mentions beer and gyoza)
const videoHighId = "creator_test_high";
const videoHigh = {
    id: videoHighId,
    title: "手作り餃子とプレミアムビールの最高の晩酌レビュー",
    format: "縦型 (Shorts)",
    status: "active",
    context: {
        food_items: ["餃子", "ビール", "おつまみ"],
        tone: "料理、晩酌、美味しい食事",
        description: "焼き立ての餃子と冷えたビールを楽しむ動画"
    }
};

// Video B: Low relevance
const videoLowId = "creator_test_low";
const videoLow = {
    id: videoLowId,
    title: "オフィスのデスク整理術と生産性向上ハック",
    format: "縦型 (Shorts)",
    status: "active",
    context: {
        food_items: ["文房具", "ノートパソコン"],
        tone: "ビジネス、ライフハック、整理整頓",
        description: "机周りをスッキリさせる方法を紹介する動画"
    }
};

// Sponsor Ad A: Beer maker (target of high relevance)
const adBeer = {
    id: "ad_beer_test",
    title: "プレミアム生ビール 極み生",
    brand: "BeerMakerA",
    status: "active",
    isAd: true
};

// Sponsor Ad B: Snack manufacturer (target of mild relevance)
const adSnack = {
    id: "ad_snack_test",
    title: "激辛スパイスチップス",
    brand: "SnackMakerC",
    status: "active",
    isAd: true
};

// 3. Inject campaigns into signage loop STATE
signageServer.injectCampaign("9:16", videoHigh, "PAID");
signageServer.injectCampaign("9:16", videoLow, "PAID");
signageServer.injectCampaign("9:16", adBeer, "PAID");
signageServer.injectCampaign("9:16", adSnack, "PAID");

// 4. Test calculateAdCreatorMatch function directly
console.log("\n[Test 1] Calculating Match Scores...");
const scoreHighBeer = adEngine.calculateAdCreatorMatch(videoHigh, adBeer);
console.log(`  - Video(Gyoza/Beer) + Ad(Beer) Match Score: ${scoreHighBeer} (Expected >= 0.90)`);
assert(scoreHighBeer >= 0.90, "Score should be >= 0.90 for high relevance pairing");

const scoreHighSnack = adEngine.calculateAdCreatorMatch(videoHigh, adSnack);
console.log(`  - Video(Gyoza/Beer) + Ad(Snack) Match Score: ${scoreHighSnack} (Expected >= 0.80)`);
assert(scoreHighSnack >= 0.80, "Score should be >= 0.80 for snack pairing with beer video");

const scoreLowBeer = adEngine.calculateAdCreatorMatch(videoLow, adBeer);
console.log(`  - Video(Office) + Ad(Beer) Match Score: ${scoreLowBeer} (Expected <= 0.60)`);
assert(scoreLowBeer <= 0.60, "Score should be low for office video and beer ad");

console.log("✅ Match Score calculations verified successfully.");

// 5. Test getPlaylist generation order and exposure boosting
console.log("\n[Test 2] Validating Playlist Generation Logic...");
const playlist = signageServer.getPlaylist("STORE_001", false);

// Filter out base local loop videos to focus on injected ones
const filteredPlaylist = playlist.filter(item => 
    [videoHighId, videoLowId, adBeer.id, adSnack.id].includes(item.id)
);

console.log("  - Generated Playlist structure:");
filteredPlaylist.forEach((item, idx) => {
    console.log(`    [${idx}] ID: ${item.id}, Title: ${item.title}`);
});

// Assertion: VideoHigh (gyoza) and adBeer should be paired sequentially.
// Since scoreHighBeer is >= 0.90, it should be boosted (2x exposure, meaning it appears twice in succession)
const highIndices = [];
filteredPlaylist.forEach((item, idx) => {
    if (item.id === videoHighId) highIndices.push(idx);
});

console.log(`  - High relevance video appearances: ${highIndices.length} (Expected: 2 due to 90%+ Match Boost)`);
assert.strictEqual(highIndices.length, 2, "High relevance video should be duplicated for 2x boost");

// Check sequential alignment: AdBeer should follow immediately after VideoHigh
highIndices.forEach(idx => {
    const nextItem = filteredPlaylist[idx + 1];
    assert(nextItem, "Sequential ad must exist after creator video");
    console.log(`    - Found sequential ad after creator video: ${nextItem.id} (Expected: ${adBeer.id})`);
    assert.strictEqual(nextItem.id, adBeer.id, "Beer ad must immediately follow the high relevance beer video");
});

console.log("✅ Sequential playlist alignment and 2x exposure boost verified successfully.");

// 6. Test performance feedback dynamic score calibration
console.log("\n[Test 3] Testing dynamic performance feedback loop...");
// Video High starts with no stats, so score is based strictly on AI context (baseScore = 0.98)
// Now simulate high view count but low performance metrics (e.g. high skip rate and 0 uplift)
// This should lower the matchmaking score dynamically
const poorVideo = {
    ...videoHigh,
    skip: 45, // High skip rate (poor viewer retention)
    uplift: 2 // Low sales uplift
};

const updatedScore = adEngine.calculateAdCreatorMatch(poorVideo, adBeer);
console.log(`  - Initial Match Score: ${scoreHighBeer}`);
console.log(`  - Calibrated Match Score (Poor Performance): ${updatedScore} (Expected < ${scoreHighBeer})`);
assert(updatedScore < scoreHighBeer, "Match score should drop dynamically due to poor performance feedback");

console.log("✅ Performance feedback dynamic calibration verified successfully.");

console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The playlist matching engine is fully validated.");

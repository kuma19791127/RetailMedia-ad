// Ad Engine: Sigmoid Analytics & Attribution & Context (Real-Time Weather & Forecast)

const POS_LOGS = [
    { time: new Date().toISOString(), sku: "4977634803472", qty: 1 },
    { time: "14:15:00", sku: "4977634803472", qty: 2 }
];

const REGION_COORDS = {
    "Hokkaido": { lat: 43.0618, lon: 141.3545 },
    "Aomori": { lat: 40.8226, lon: 140.7406 },
    "Iwate": { lat: 39.7020, lon: 141.1544 },
    "Miyagi": { lat: 38.2682, lon: 140.8694 },
    "Akita": { lat: 39.7200, lon: 140.1025 },
    "Yamagata": { lat: 38.2555, lon: 140.3396 },
    "Fukushima": { lat: 37.7608, lon: 140.4748 },
    "Ibaraki": { lat: 36.3659, lon: 140.4715 },
    "Tochigi": { lat: 36.5551, lon: 139.8828 },
    "Gunma": { lat: 36.3895, lon: 139.0634 },
    "Saitama": { lat: 35.8617, lon: 139.6455 },
    "Chiba": { lat: 35.6074, lon: 140.1065 },
    "Tokyo": { lat: 35.6895, lon: 139.6917 },
    "Kanagawa": { lat: 35.4478, lon: 139.6425 },
    "Niigata": { lat: 37.9022, lon: 139.0236 },
    "Toyama": { lat: 36.6953, lon: 137.2113 },
    "Ishikawa": { lat: 36.5613, lon: 136.6562 },
    "Fukui": { lat: 36.0641, lon: 136.2196 },
    "Yamanashi": { lat: 35.6642, lon: 138.5684 },
    "Nagano": { lat: 36.6486, lon: 138.1948 },
    "Gifu": { lat: 35.4233, lon: 136.7607 },
    "Shizuoka": { lat: 34.9756, lon: 138.3828 },
    "Aichi": { lat: 35.1815, lon: 136.9066 },
    "Mie": { lat: 34.7186, lon: 136.5190 },
    "Shiga": { lat: 35.0045, lon: 135.8686 },
    "Kyoto": { lat: 35.0116, lon: 135.7681 },
    "Osaka": { lat: 34.6937, lon: 135.5023 },
    "Hyogo": { lat: 34.6939, lon: 135.1835 },
    "Nara": { lat: 34.6853, lon: 135.8328 },
    "Wakayama": { lat: 34.2260, lon: 135.1675 },
    "Tottori": { lat: 35.5011, lon: 134.2351 },
    "Shimane": { lat: 35.4681, lon: 133.0484 },
    "Okayama": { lat: 34.6555, lon: 133.9198 },
    "Hiroshima": { lat: 34.3853, lon: 132.4553 },
    "Yamaguchi": { lat: 34.1861, lon: 131.4705 },
    "Tokushima": { lat: 34.0703, lon: 134.5548 },
    "Kagawa": { lat: 34.3428, lon: 134.0466 },
    "Ehime": { lat: 33.8417, lon: 132.7653 },
    "Kochi": { lat: 33.5597, lon: 133.5311 },
    "Fukuoka": { lat: 33.6064, lon: 130.4183 },
    "Saga": { lat: 33.2635, lon: 130.3008 },
    "Nagasaki": { lat: 32.7503, lon: 129.8777 },
    "Kumamoto": { lat: 32.7898, lon: 130.7416 },
    "Oita": { lat: 33.2382, lon: 131.6126 },
    "Miyazaki": { lat: 31.9111, lon: 131.4239 },
    "Kagoshima": { lat: 31.5966, lon: 130.5571 },
    "Okinawa": { lat: 26.2124, lon: 127.6809 }
};

function sigmoid(x, L = 1, k = 1, x0 = 0) {
    return L / (1 + Math.exp(-k * (x - x0)));
}

module.exports = {
    calculateAttribution: (playLogs) => {
        let attributedSales = 0;
        let totalRevenue = 0;
        playLogs.forEach(log => {
            POS_LOGS.forEach(pos => {
                if (pos.sku === log.sku) { attributedSales++; totalRevenue += 300; }
            });
        });
        return { sales: attributedSales, revenue: totalRevenue };
    },

    analyzeThreshold: (impactMultiplier = 1.0) => {
        const dataPoints = [];
        const L = 100 * impactMultiplier;
        const k = 1.5;
        const x0 = 3 / impactMultiplier;

        for (let x = 0; x <= 10; x++) {
            let y = sigmoid(x, L, k, x0);
            dataPoints.push({ x, y: Math.round(y * 10) / 10 });
        }
        return { threshold: Math.round(x0 * 10) / 10, curve: dataPoints, score: impactMultiplier };
    },

    analyzeContext: async (region = 'Tokyo', lat = null, lon = null) => {
        let coords = REGION_COORDS[region] || REGION_COORDS['Tokyo'];

        // Override if real coordinates provided
        if (lat && lon) {
            coords = { lat: parseFloat(lat), lon: parseFloat(lon) };
        }

        let weatherData = { temperature: 20, is_day: 1, weathercode: 0 };
        let dailyForecast = { time: [], weathercode: [], temperature_2m_max: [], temperature_2m_min: [] };

        try {
            // Updated API: Fetch Current + Daily Forecast (7 days)
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo`;

            if (global.fetch) {
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (data.current_weather) weatherData = data.current_weather;
                    if (data.daily) dailyForecast = data.daily;
                }
            }
        } catch (e) {
            console.error("Weather API Error (Switched to Fallback):", e.message);
        }

        const currentTemp = weatherData.temperature ?? 20;
        const wCode = weatherData.weathercode ?? 0;
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', hour: 'numeric', hour12: false });
        const currentHour = parseInt(formatter.format(now), 10);

        // 1. Initialize Baseline Impact
        let impact = {
            time_impact: { "Morning": 50, "Lunch": 50, "Evening": 50 },
            weather_impact: { "Sunny": 50, "Rainy": 50, "Cloudy": 50 },
            temp_impact: { "Hot": 50, "Mild": 50, "Cold": 50 },
            active_factors: [] // To hold keys like "Lunch", "Hot" for highlighting
        };

        // 2. Score Calculation & Active Flagging
        let score = 1.0;

        // --- TIME IMPACT ---
        if (currentHour >= 6 && currentHour < 11) {
            impact.time_impact["Morning"] = 200; // Boost
            impact.active_factors.push("Morning");
        } else if (currentHour >= 11 && currentHour < 15) {
            impact.time_impact["Lunch"] = 200;
            impact.active_factors.push("Lunch");
            score += 0.2; // Lunch rush boost
        } else if (currentHour >= 15 && currentHour < 24) {
            impact.time_impact["Evening"] = 200;
            impact.active_factors.push("Evening");
        }

        // --- WEATHER IMPACT ---
        if (wCode <= 1) { // Sunny
            impact.weather_impact["Sunny"] = 200;
            impact.active_factors.push("Sunny");
            score += 0.3;
        } else if (wCode >= 50) { // Rainy
            impact.weather_impact["Rainy"] = 200;
            impact.active_factors.push("Rainy");
            score -= 0.1;
        } else { // Cloudy
            impact.weather_impact["Cloudy"] = 200;
            impact.active_factors.push("Cloudy");
        }

        // --- TEMP IMPACT ---
        if (currentTemp >= 28) {
            impact.temp_impact["Hot"] = 250;
            impact.active_factors.push("Hot");
            score += 0.5;
        } else if (currentTemp <= 10) {
            impact.temp_impact["Cold"] = 250;
            impact.active_factors.push("Cold");
            score += 0.4;
        } else {
            impact.temp_impact["Mild"] = 200;
            impact.active_factors.push("Mild");
        }

        // 3. Construct Forecast Array
        // Transform the structure for easier frontend consumption
        const weekly_forecast = [];
        if (dailyForecast.time && dailyForecast.time.length > 0) {
            for (let i = 0; i < dailyForecast.time.length; i++) {
                weekly_forecast.push({
                    date: dailyForecast.time[i],
                    code: dailyForecast.weathercode[i],
                    max: dailyForecast.temperature_2m_max[i],
                    min: dailyForecast.temperature_2m_min[i]
                });
            }
        }

        impact.current_condition = {
            temp: currentTemp,
            weather_code: wCode,
            region: region,
            impact_score: Math.round(score * 100) / 100
        };

        impact.weekly_forecast = weekly_forecast; // Pass to frontend

        return impact;
    },

    analyzeTrafficStats: () => {
        return {
            os_share: { "iOS": 75, "Android": 25 }
        };
    },

    calculateAdCreatorMatch: (video, ad) => {
        if (!video || !ad) return 0.50;

        const videoTitle = (video.title || '').toLowerCase();
        const adTitle = (ad.title || ad.name || '').toLowerCase();
        const sponsor = (ad.sponsor || ad.brand || '').toLowerCase();

        // 1. AI Context Metadata (Geminiによる映像・トーン意味解析) に基づくセマンティックマッチ
        let contextMatchScore = 0.50;
        let contextFound = false;

        if (video.context && typeof video.context === 'object') {
            contextFound = true;
            const foodItems = video.context.food_items || [];
            const tone = (video.context.tone || '').toLowerCase();
            const desc = (video.context.description || '').toLowerCase();

            // アルコール・ビール関連広告とのマッチング
            const isBeerAd = adTitle.includes('ビール') || sponsor.includes('ビール') || adTitle.includes('極み生') || sponsor.includes('酒造') || adTitle.includes('酒');
            if (isBeerAd) {
                // ビールやアルコールが映像に含まれる、または晩酌トーンである場合
                const hasBeerOrAlcohol = foodItems.some(f => f.includes('ビール') || f.includes('酒') || f.includes('アルコール') || f.includes('ワイン') || f.includes('サワー'));
                const hasBeerSnacks = foodItems.some(f => f.includes('餃子') || f.includes('焼き鳥') || f.includes('唐揚げ') || f.includes('おつまみ') || f.includes('肉'));
                const isDrinkingTone = tone.includes('晩酌') || tone.includes('飲み') || tone.includes('居酒屋') || desc.includes('ビール') || desc.includes('飲む');

                if (hasBeerOrAlcohol && isDrinkingTone) {
                    contextMatchScore = Math.max(contextMatchScore, 0.98); // 最高マッチ
                } else if (hasBeerSnacks && isDrinkingTone) {
                    contextMatchScore = Math.max(contextMatchScore, 0.95);
                } else if (hasBeerSnacks || isDrinkingTone) {
                    contextMatchScore = Math.max(contextMatchScore, 0.88);
                }
            }

            // スナック・おつまみ関連広告とのマッチング
            const isSnackAd = adTitle.includes('スナック') || adTitle.includes('菓子') || adTitle.includes('おつまみ') || sponsor.includes('c社') || sponsor.includes('メーカーc');
            if (isSnackAd) {
                const hasSnacks = foodItems.some(f => f.includes('つまみ') || f.includes('スナック') || f.includes('唐揚げ') || f.includes('ポテト') || f.includes('辛'));
                const isSnackTone = tone.includes('おやつ') || tone.includes('晩酌') || tone.includes('おつまみ') || desc.includes('つまみ') || desc.includes('お菓子');

                if (hasSnacks && isSnackTone) {
                    contextMatchScore = Math.max(contextMatchScore, 0.92);
                } else if (hasSnacks || isSnackTone) {
                    contextMatchScore = Math.max(contextMatchScore, 0.85);
                }
            }

            // 一般食品広告とのマッチング
            const isFoodAd = adTitle.includes('食') || adTitle.includes('料理') || sponsor.includes('食品') || sponsor.includes('レストラン');
            if (isFoodAd) {
                const hasFood = foodItems.length > 0;
                const isCookingTone = tone.includes('料理') || tone.includes('グルメ') || tone.includes('食事') || desc.includes('作る') || desc.includes('食べる');

                if (hasFood && isCookingTone) {
                    contextMatchScore = Math.max(contextMatchScore, 0.90);
                } else if (hasFood || isCookingTone) {
                    contextMatchScore = Math.max(contextMatchScore, 0.80);
                }
            }
        }

        // 2. キーワードベースのフォールバックマッチング（context が無い、またはスコアが低い場合）
        let keywordScore = 0.50;
        const alcoholVideoKeywords = ['餃子', '焼き鳥', '居酒屋', 'ビール', 'お酒', '酒場', 'レビュー', 'の作り方', '酒'];
        const alcoholAdKeywords = ['ビール', '酒', '極み生', 'フェア', 'クラフト', '酒造'];

        const hasAlcoholVideo = alcoholVideoKeywords.some(kw => videoTitle.includes(kw));
        const hasAlcoholAd = alcoholAdKeywords.some(kw => adTitle.includes(kw) || sponsor.includes(kw));

        if (hasAlcoholVideo && hasAlcoholAd) {
            if (adTitle.includes('極み生') || sponsor.includes('a社') || sponsor.includes('ビールメーカー')) {
                keywordScore = 0.98;
            } else {
                keywordScore = 0.92;
            }
        }

        const snackVideoKeywords = ['料理', 'おつまみ', '辛', '激辛', '揚げ物', 'スナック'];
        const snackAdKeywords = ['スナック', '菓子', 'つまみ', '激辛', 'c社', 'メーカーc'];

        const hasSnackVideo = snackVideoKeywords.some(kw => videoTitle.includes(kw));
        const hasSnackAd = snackAdKeywords.some(kw => adTitle.includes(kw) || sponsor.includes(kw));

        if ((hasSnackVideo || hasAlcoholVideo) && hasSnackAd) {
            keywordScore = Math.max(keywordScore, 0.88);
        }

        const commonKeywords = ['料理', 'グルメ', '食品', '飲料', 'ごはん', 'ランチ', 'カフェ', '肉'];
        commonKeywords.forEach(kw => {
            if (videoTitle.includes(kw) && (adTitle.includes(kw) || sponsor.includes(kw))) {
                keywordScore = Math.max(keywordScore, 0.75);
            }
        });

        // 基本スコアを AI コンテキストマッチとキーワードマッチの最大値とする
        let baseScore = contextFound ? Math.max(contextMatchScore, keywordScore) : keywordScore;

        // 3. リアルタイム実績フィードバック（POS売上貢献度＆CM視聴維持率）による動的補正
        // POS貢献度 (uplift): 例: "+12%" -> 12
        // CM離脱率 (skip): 例: "15%" -> 15 (離脱率が低いほど高評価、基準は30%とする)
        let upliftVal = 0;
        if (video.uplift && typeof video.uplift === 'string') {
            upliftVal = parseFloat(video.uplift.replace(/[+%]/g, '')) || 0;
        } else if (typeof video.uplift === 'number') {
            upliftVal = video.uplift;
        }

        let skipVal = 30; // デフォルト基準値
        if (video.skip && typeof video.skip === 'string') {
            skipVal = parseFloat(video.skip.replace(/%/g, '')) || 30;
        } else if (typeof video.skip === 'number') {
            skipVal = video.skip;
        }

        // 実績スコアの計算 (POS売上貢献度は高いほど良く、CM離脱率は低いほど良い)
        const posPerformanceScore = Math.min(1.0, upliftVal / 20.0); // 20%以上の向上で満点
        const retentionPerformanceScore = Math.max(0.0, Math.min(1.0, (50.0 - skipVal) / 40.0)); // 離脱率10%以下で満点、50%以上で0点

        // AI判定(40%) + POS実績(30%) + 視聴維持実績(30%) で最終スコアを動的にブレンド
        // ※実績データが存在しない場合は、AI判定基準のみとする
        let finalScore = baseScore;
        const hasPerformanceData = upliftVal > 0 || skipVal !== 30;
        if (hasPerformanceData) {
            finalScore = (baseScore * 0.4) + (posPerformanceScore * 0.3) + (retentionPerformanceScore * 0.3);
        }

        return Math.round(finalScore * 100) / 100;
    }
};

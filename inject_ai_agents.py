import codecs

agent_code = """
// =========================================================================
// AI Agent Endpoints (Ad Operations & Shift-Manual Sync)
// =========================================================================

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
            message: `エージェント分析完了:\n${result.analysis}\n【配信予定時間】${result.targetTime}\n【音声スクリプト】${result.voiceScript}`
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
${manuals.map(m => `- [ID: ${m.id}] ${m.title}`).join('\\n')}

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

"""

with codecs.open('server_retail_dist.js', 'r', 'utf-8') as f:
    content = f.read()

# Find the app.listen line
idx = content.rfind('app.listen(')
if idx != -1:
    new_content = content[:idx] + agent_code + content[idx:]
    with codecs.open('server_retail_dist.js', 'w', 'utf-8') as f:
        f.write(new_content)
    print('Injected AI Agent endpoints into server_retail_dist.js')
else:
    print('app.listen not found')

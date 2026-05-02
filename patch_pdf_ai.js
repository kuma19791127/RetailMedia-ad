
const fs = require('fs');

let code = fs.readFileSync('server_retail_dist.js', 'utf8');

const newEndpoint = 
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

        const FIXED_URL = \https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\;

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
        generatedText = generatedText.replace(/^\s*\\\(json)?\s*/i, '').replace(/\s*\\\\s*$/, '');
        
        let resultJson = JSON.parse(generatedText);
        res.json({ success: true, result: resultJson });
    } catch (e) {
        console.error("[ManualHelp AI Error]", e);
        res.status(500).json({ error: e.toString() });
    }
});
;

if (!code.includes('/api/manualhelp/pdf-to-steps')) {
    code = code.replace("app.post('/api/manualhelp/video-to-steps'", newEndpoint + "\napp.post('/api/manualhelp/video-to-steps'");
    fs.writeFileSync('server_retail_dist.js', code, 'utf8');
    print("Patched server_retail_dist.js with PDF AI endpoint.");
} else {
    print("Endpoint already exists.");
}

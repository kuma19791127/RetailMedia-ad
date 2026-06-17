const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\one\\.gemini\\antigravity\\brain\\9200038a-5584-4543-a84f-7581b846a51b\\.system_generated\\logs\\transcript.jsonl';

async function searchLog() {
    if (!fs.existsSync(logPath)) {
        console.log("Log file not found");
        return;
    }
    const fileStream = fs.createReadStream(logPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    console.log("=== GMO Discussions on 2026-05-28 ===");
    for await (const line of rl) {
        if (line.includes('2026-05-28')) {
            try {
                const obj = JSON.parse(line);
                if (obj.content && (obj.content.toLowerCase().includes('gmo') || obj.content.toLowerCase().includes('bank') || obj.content.toLowerCase().includes('申込') || obj.content.toLowerCase().includes('申請'))) {
                    console.log(`\n--- Step ${obj.step_index} (${obj.type} by ${obj.source}) ---`);
                    console.log(obj.content);
                }
            } catch (e) {}
        }
    }
}
searchLog();

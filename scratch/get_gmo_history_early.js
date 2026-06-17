const fs = require('fs');
const readline = require('readline');

const logPath = 'C:/Users/one/.gemini/antigravity/brain/9200038a-5584-4543-a84f-7581b846a51b/.system_generated/logs/transcript.jsonl';

async function searchLog() {
    if (!fs.existsSync(logPath)) {
        console.log("Log file not found at:", logPath);
        return;
    }
    const fileStream = fs.createReadStream(logPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    console.log("=== Steps 2100 to 2450 ===");
    for await (const line of rl) {
        try {
            const obj = JSON.parse(line);
            if (obj.step_index >= 2100 && obj.step_index <= 2450) {
                if (obj.content && (obj.content.toLowerCase().includes('gmo') || obj.content.toLowerCase().includes('bank') || obj.content.toLowerCase().includes('アクセス元') || obj.content.toLowerCase().includes('コールバック'))) {
                    console.log(`\n--- Step ${obj.step_index} (${obj.type} by ${obj.source}) ---`);
                    console.log(obj.content);
                }
            }
        } catch (e) {}
    }
}
searchLog();

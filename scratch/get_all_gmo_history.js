const fs = require('fs');
const readline = require('readline');

const logPath = 'C:/Users/one/.gemini/antigravity/brain/9200038a-5584-4543-a84f-7581b846a51b/.system_generated/logs/transcript.jsonl';

async function searchLog() {
    if (!fs.existsSync(logPath)) {
        console.log("Log not found");
        return;
    }
    const fileStream = fs.createReadStream(logPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        try {
            const obj = JSON.parse(line);
            if (obj.type === 'USER_INPUT' || obj.type === 'PLANNER_RESPONSE') {
                if (obj.content && (obj.content.toLowerCase().includes('gmo') || obj.content.toLowerCase().includes('銀行') || obj.content.toLowerCase().includes('申請'))) {
                    console.log(`\n--- Step ${obj.step_index} (${obj.type} by ${obj.source}) ---`);
                    console.log(obj.content);
                }
            }
        } catch (e) {}
    }
}
searchLog();

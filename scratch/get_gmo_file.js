const fs = require('fs');
const readline = require('readline');

const logPath = 'C:/Users/one/.gemini/antigravity/brain/9200038a-5584-4543-a84f-7581b846a51b/.system_generated/logs/transcript.jsonl';
const outputPath = 'c:/Users/one/.gemini/antigravity/playground/twilight-parsec/scratch/gmo_history_filtered.txt';

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

    let outContent = "=== GMO Discussions before Step 2400 ===\n";
    for await (const line of rl) {
        try {
            const obj = JSON.parse(line);
            if (obj.type === 'USER_INPUT' || obj.type === 'PLANNER_RESPONSE') {
                if (obj.content && (obj.content.toLowerCase().includes('gmo') || obj.content.toLowerCase().includes('銀行') || obj.content.toLowerCase().includes('申請'))) {
                    if (obj.step_index < 2400) {
                        outContent += `\n--- Step ${obj.step_index} (${obj.type} by ${obj.source}) ---\n`;
                        outContent += obj.content + "\n";
                    }
                }
            }
        } catch (e) {}
    }

    fs.writeFileSync(outputPath, outContent, 'utf8');
    console.log("Saved to:", outputPath);
}
searchLog();

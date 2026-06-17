const fs = require('fs');
const readline = require('readline');

const logPath = 'C:/Users/one/.gemini/antigravity/brain/9200038a-5584-4543-a84f-7581b846a51b/.system_generated/logs/transcript.jsonl';
const outputPath = 'c:/Users/one/.gemini/antigravity/playground/twilight-parsec/scratch/gmo_history_step2114.txt';

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

    let outContent = "=== GMO Discussions Step 2114 to 2200 ===\n";
    for await (const line of rl) {
        try {
            const obj = JSON.parse(line);
            if (obj.step_index >= 2114 && obj.step_index <= 2200) {
                if (obj.type === 'USER_INPUT' || obj.type === 'PLANNER_RESPONSE') {
                    outContent += `\n--- Step ${obj.step_index} (${obj.type} by ${obj.source}) ---\n`;
                    outContent += obj.content + "\n";
                }
            }
        } catch (e) {}
    }

    fs.writeFileSync(outputPath, outContent, 'utf8');
    console.log("Saved to:", outputPath);
}
searchLog();

const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\one\\.gemini\\antigravity\\brain\\9200038a-5584-4543-a84f-7581b846a51b\\.system_generated\\logs\\transcript.jsonl';

async function getContext() {
    if (!fs.existsSync(logPath)) {
        console.log("Log file not found");
        return;
    }
    const fileStream = fs.createReadStream(logPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    console.log("=== Historical Steps around 2560-2570 ===");
    for await (const line of rl) {
        try {
            const obj = JSON.parse(line);
            if (obj.step_index >= 2560 && obj.step_index <= 2570) {
                console.log(`\n--- Step ${obj.step_index} (${obj.type} by ${obj.source}) ---`);
                console.log(obj.content ? obj.content.substring(0, 1000) : "No text content");
            }
        } catch (e) {}
    }
}
getContext();

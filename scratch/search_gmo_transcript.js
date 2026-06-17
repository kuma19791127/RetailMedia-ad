const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\one\\.gemini\\antigravity\\brain\\9200038a-5584-4543-a84f-7581b846a51b\\.system_generated\\logs\\transcript.jsonl';

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

    const matches = [];
    for await (const line of rl) {
        try {
            const obj = JSON.parse(line);
            if (obj.content && obj.content.toLowerCase().includes('gmo')) {
                if (obj.type === 'USER_INPUT' || obj.type === 'PLANNER_RESPONSE') {
                    // Filter out the current run (which has steps > 4000)
                    if (obj.step_index < 4000) {
                        matches.push({
                            step: obj.step_index,
                            type: obj.type,
                            source: obj.source,
                            content: obj.content
                        });
                    }
                }
            }
        } catch (e) {
            // ignore
        }
    }

    console.log(`Found ${matches.length} historical matches.`);
    matches.forEach(m => {
        console.log(`\n--- Step ${m.step} (${m.type} by ${m.source}) ---`);
        console.log(m.content);
    });
}
searchLog();

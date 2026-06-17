const fs = require('fs');
const readline = require('readline');

async function checkSpecificStep() {
    const logPath = 'C:\\Users\\one\\.gemini\\antigravity\\brain\\9200038a-5584-4543-a84f-7581b846a51b\\.system_generated\\logs\\transcript.jsonl';
    const fileStream = fs.createReadStream(logPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let index = 0;
    for await (const line of rl) {
        index++;
        if (index === 254) {
            const data = JSON.parse(line);
            console.log('--- LINE 254 DETAIL ---');
            console.log('Step Index:', data.step_index);
            console.log('Source:', data.source);
            console.log('Type:', data.type);
            console.log('Content:', data.content);
            console.log('Tool Calls:', JSON.stringify(data.tool_calls, null, 2));
            break;
        }
    }
}

checkSpecificStep().catch(console.error);

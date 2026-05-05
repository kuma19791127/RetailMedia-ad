const fs = require('fs');

let fileStr = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js', 'utf8');

const targetFFmpeg = `                .on('end', () => {`;
const fallbackLogic = `                .on('error', (err) => {
                    console.error("[AdUpload] FFmpeg transcoding failed (likely missing on Windows). Fallback to raw base64 data.", err);
                    try { require('fs').unlinkSync(inputPath); } catch(e){}
                    processAndInject(rawUrl);
                    if (typeof broadcastEvent === 'function') broadcastEvent({ type: 'force_reload' });
                })
                .on('end', () => {`;

if (fileStr.includes(targetFFmpeg) && !fileStr.includes('Fallback to raw base64 data')) {
    fileStr = fileStr.replace(targetFFmpeg, fallbackLogic);
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js', fileStr, 'utf8');
    console.log('Patched ffmpeg fallback in server_retail_dist.js');
}

// Check server.js just in case
let serverFileStr = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/server.js', 'utf8');
if (serverFileStr.includes(targetFFmpeg) && !serverFileStr.includes('Fallback to raw base64 data')) {
    serverFileStr = serverFileStr.replace(targetFFmpeg, fallbackLogic);
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/server.js', serverFileStr, 'utf8');
    console.log('Patched ffmpeg fallback in server.js');
}

console.log('Done script');

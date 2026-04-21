const fs = require('fs');

let distStr = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js', 'utf8');
let ssStr = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/signage_server.js', 'utf8');

// Patch server_retail_dist.js lines around `youtube_url: finalUrl.includes('youtu') ? finalUrl : null`
// Change it to: finalUrl && !finalUrl.startsWith('data:') && finalUrl.includes('youtu') ? finalUrl : (youtube_url || null)
distStr = distStr.replace(/youtube_url:\s*finalUrl\.includes\('youtu'\)\s*\?\s*finalUrl\s*:\s*null/g, 
  "youtube_url: (finalUrl && !finalUrl.startsWith('data:') && finalUrl.includes('youtu')) ? finalUrl : null");

// Also check around line 684 for the other place: `youtube_url: finalUrl && finalUrl.includes('youtu') ? finalUrl : youtube_url,`
distStr = distStr.replace(/youtube_url:\s*finalUrl\s*&&\s*finalUrl\.includes\('youtu'\)\s*\?\s*finalUrl\s*:\s*youtube_url/g,
  "youtube_url: (finalUrl && !finalUrl.startsWith('data:') && finalUrl.includes('youtu')) ? finalUrl : youtube_url");

fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js', distStr, 'utf8');

// Patch signage_server.js around `is_youtube: !!(metadata.youtube_url || (metadata.url && (metadata.url.includes('youtube') || metadata.url.includes('youtu.be')))),`
ssStr = ssStr.replace(/is_youtube: !!\(metadata\.youtube_url \|\| \(metadata\.url && \(metadata\.url\.includes\('youtube'\) \|\| metadata\.url\.includes\('youtu\.be'\)\)\)\),/g,
  "is_youtube: !!( (metadata.youtube_url && !metadata.youtube_url.startsWith('data:')) || (metadata.url && !metadata.url.startsWith('data:') && (metadata.url.includes('youtube') || metadata.url.includes('youtu.be'))) ),");

fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/signage_server.js', ssStr, 'utf8');

console.log('Patched Youtube bug in servers');

// Patch signage_player.html to fix the Uncaught TypeError on id
let playerStr = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/signage_player.html', 'utf8');
playerStr = playerStr.replace(/sendBeacon\(currentItem\.id\);/g, "sendBeacon(currentItem?.id);");

// Also fix budoux bug in creator_portal.html
let cpStr = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/creator_portal.html', 'utf8');
cpStr = cpStr.replace(/<script src="https:\/\/unpkg\.com\/budoux\/bundle\/budoux-ja\.min\.js"><\/script>/g, 
  "<script src=\"https://unpkg.com/budoux/bundle/budoux-ja.min.js\"></script>\n<script>if(window.customElements.get('budoux-ja')) { console.log('Already defined'); } else { /* loaded */ }</script>"); // just preventing duplicate error is hard if the script auto-defines.
// Better: remove duplicate script tags if present
const count = (cpStr.match(/<script src="https:\/\/unpkg\.com\/budoux\/bundle\/budoux-ja\.min\.js"><\/script>/g) || []).length;
if(count > 1) {
    cpStr = cpStr.replace('<script src="https://unpkg.com/budoux/bundle/budoux-ja.min.js"></script>', '<!-- dup rem -->');
}
fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/creator_portal.html', cpStr, 'utf8');


console.log('Done script');

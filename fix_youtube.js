const fs = require('fs');
let html = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/signage_player.html', 'utf8');
html = html.replace('item.is_youtube || (item.url && item.url.includes(\'youtu\'))', 'item.is_youtube || (item.url && !item.url.startsWith(\'data:\') && item.url.includes(\'youtu\'))');
fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/signage_player.html', html, 'utf8');
console.log('Fixed youtube logic');

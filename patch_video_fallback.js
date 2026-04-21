const fs = require('fs');
let fileStr = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/signage_player.html', 'utf8');

const targetStr = `                    // ADD A DELAY! If there's only 1 broken video, calling playNext() synchronously \r
                    // will cause an infinite loop of promise rejections.\r
                    setTimeout(() => {\r
                        playNext();\r
                    }, 3000);`;

const targetStrLF = targetStr.replace(/\r/g, '');

const replacement = `                    if (e2.name === 'NotSupportedError') {
                        let errDiv = document.getElementById('debug-video-error');
                        if (!errDiv) {
                            errDiv = document.createElement('div');
                            errDiv.id = 'debug-video-error';
                            errDiv.style.cssText = "position:absolute; top:30%; left:10%; right:10%; background:rgba(231,76,60,0.95); color:white; padding:30px; border-radius:12px; font-weight:bold; font-size:1.5rem; text-align:center; z-index:9999; box-shadow:0 10px 30px rgba(0,0,0,0.5);";
                            document.getElementById('player-container').appendChild(errDiv);
                        }
                        errDiv.innerHTML = '⚠️ 再生エラー<br><span style="font-size:1rem;font-weight:normal;display:block;margin-top:10px;">アップロードされた動画形式（.mov等）は現在のブラウザでサポートされていません。<br>iPhone等で撮影した動画は <b>.mp4</b> に変換してアップロードをお願いします。<br><br>(5秒後に次のコンテンツへスキップします...)</span>';
                        errDiv.style.display = 'block';
                        setTimeout(() => {
                            errDiv.style.display = 'none';
                            playNext();
                        }, 5000);
                    } else {
                        setTimeout(() => {
                            playNext();
                        }, 3000);
                    }`;

if (fileStr.includes(targetStr)) {
    fileStr = fileStr.replace(targetStr, replacement);
    console.log("Replaced CRLF");
} else if (fileStr.includes(targetStrLF)) {
    fileStr = fileStr.replace(targetStrLF, replacement);
    console.log("Replaced LF");
} else {
    // regex fallback
    fileStr = fileStr.replace(/\/\/ ADD A DELAY[\s\S]*?3000\);/g, replacement);
    console.log("Replaced Regex");
}

fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/signage_player.html', fileStr, 'utf8');
console.log("Done");

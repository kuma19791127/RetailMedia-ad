const fs = require('fs');
const pathStr = 'C:/Users/one/Desktop/RetailMedia_System/creator_portal.html';
let t = fs.readFileSync(pathStr, 'utf8');

const targetStr = "<h2>🎬 コンテンツ最適化状況 (AI判定)</h2>";
const replacementStr = `<h2>🎬 コンテンツ最適化状況 (AI判定) <a href="javascript:void(0)" onclick="showAdPolicy()" style="font-size:0.9rem; font-weight:normal; color:#3498db; text-decoration:underline; margin-left:15px; display:inline-block;">[配信・広告基準]</a></h2>`;

t = t.replace(targetStr, replacementStr);

// Also need to add showAdPolicy function to the script section.
const funcStr = `
        function showAdPolicy() {
            Swal.fire({
                title: '配信・広告審査基準 (AI Moderation)',
                html: '<div style="text-align:left; font-size:0.95rem; line-height:1.6; color:#333;">以下に該当する不適切なコンテンツが含まれている配信・広告は、AIによって自動的に拒絶される可能性があります。<br><br><b>1:</b> 過度な暴力、性的描写、ヘイトスピーチ等の公序良俗に反する内容。<br><b>2:</b> 「必ず儲かる」「投資で稼ぐ」といった投資詐欺・誇大広告。<br><b>3:</b> 「続きはLINEで」「LINE登録はこちら」などのLINEや外部SNSへ誘導し情報商材を売るようなスパム・詐欺的誘導。</div>',
                icon: 'info',
                confirmButtonText: '確認しました',
                confirmButtonColor: '#3b82f6'
            });
        }
`;

if (t.indexOf("function showAdPolicy()") === -1) {
    t = t.replace("</script>", funcStr + "\n    </script>");
}

fs.writeFileSync(pathStr, t);
console.log("Patched creator_portal link");

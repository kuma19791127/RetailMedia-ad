const fs = require('fs');

function patchFile(filename, prefix) {
    if (!fs.existsSync(filename)) return;
    let content = fs.readFileSync(filename, 'utf8');

    // 1. Inject bg logic in didOpen
    const regex1 = new RegExp("didOpen: \\(\\) => \\{\\s*const dropzone = document\\.getElementById\\('"+prefix+"-dropzone'\\);\\s*const fileInput = document\\.getElementById\\('"+prefix+"-file'\\);\\s*const filenameDisplay = document\\.getElementById\\('"+prefix+"-filename'\\);");
    const match1 = content.match(regex1);
    
    if(match1) {
        const urlPrefix = filename === 'creator_portal.html' ? "API_BASE + '/api/creator/review-content'" : "'/api/creator/review-content'";
        const replacement = match1[0] + 
                    const ytInput = document.getElementById('+prefix+-yt-url');
                    window._bgReviewPromise = null;
                    const startBgReview = async (file, title) => {
                        let base64 = "mock_data";
                        if(file) base64 = await fileToBase64(file);
                        window._bgReviewPromise = fetch(+urlPrefix+, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ video_base64: base64, title: title })
                        }).then(r => r.json());
                    };
                    if(ytInput) {
                        ytInput.addEventListener('input', () => {
                            if(ytInput.value.length > 10) startBgReview(null, "YouTube Video");
                        });
                    }
        ;
        content = content.replace(match1[0], replacement);
    }

    // 2. Add startBgReview to drop
    content = content.replace(
        /filenameDisplay\.innerHTML = \<span style="color:#2ecc71;">✅ \$\{e\.dataTransfer\.files\[0\]\.name\}<\\/span>\;/g,
        ilenameDisplay.innerHTML = \\<span style="color:#2ecc71;">✅ \\$\\{e.dataTransfer.files[0].name\\}<br><small style="font-size:0.8rem;color:#888;">(裏でAI審査を開始しました...)</small></span>\\;\n                            startBgReview(e.dataTransfer.files[0], e.dataTransfer.files[0].name);
    );

    // 3. Add startBgReview to change
    content = content.replace(
        /filenameDisplay\.innerHTML = \<span style="color:#2ecc71;">✅ \$\{fileInput\.files\[0\]\.name\}<\\/span>\;/g,
        ilenameDisplay.innerHTML = \\<span style="color:#2ecc71;">✅ \\$\\{fileInput.files[0].name\\}<br><small style="font-size:0.8rem;color:#888;">(裏でAI審査を開始しました...)</small></span>\\;\n                            startBgReview(fileInput.files[0], fileInput.files[0].name);
    );

    // 4. Update the await logic
    const regex4 = filename === 'creator_portal.html' 
        ? /const reviewRes = await fetch\(API_BASE \+ '\/api\/creator\/review-content', \{[\s\S]*?body: JSON\.stringify\(\{ video_base64: fileUrl \|\| "mock_data", title: title \}\)\s*\}\);\s*const reviewData = await reviewRes\.json\(\);/ 
        : /const reviewRes = await fetch\('\/api\/creator\/review-content', \{[\s\S]*?body: JSON\.stringify\(\{ video_base64: fileUrl \|\| "mock_data", title: title \}\)\s*\}\);\s*const reviewData = await reviewRes\.json\(\);/;
        
    const fetchMatch = content.match(regex4);
    if(fetchMatch) {
        const fetchReplacement = 
                        let reviewData;
                        if (window._bgReviewPromise) {
                            reviewData = await window._bgReviewPromise;
                        } else {
                             + fetchMatch[0] + 
                        }
        ;
        content = content.replace(fetchMatch[0], fetchReplacement);
    }

    fs.writeFileSync(filename, content, 'utf8');
    console.log(filename + " patched!");
}

patchFile('creator_portal.html', 'creator');
patchFile('ad_dashboard.html', 'ad');

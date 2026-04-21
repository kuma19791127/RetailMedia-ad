const fs = require('fs');

let playerStr = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/signage_player.html', 'utf8');

const tiktokStyles = `
    /* TikTok Style Overlay */
    #tiktok-overlay {
        position: absolute;
        bottom: 0px;
        left: 0;
        width: 100%;
        padding: 40px 20px 20px 20px;
        background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
        color: white;
        font-family: sans-serif;
        box-sizing: border-box;
        z-index: 100;
        pointer-events: none; /* Let clicks pass through */
        display: none;
    }
    
    #tt-brand {
        font-size: 1.2rem;
        font-weight: bold;
        margin-bottom: 5px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    #tt-title {
        font-size: 1rem;
        margin-bottom: 5px;
        line-height: 1.3;
    }

    #tt-pr-badge {
        background: rgba(255,255,255,0.2);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.8rem;
        border: 1px solid rgba(255,255,255,0.5);
    }
    
    .tt-ad-badge {
        background: #e74c3c !important;
        color: white !important;
        border: none !important;
        font-weight: bold;
    }

    /* TikTok Progress Bar */
    #tt-progress-container {
        position: absolute;
        bottom: 0px;
        left: 0;
        width: 100%;
        height: 4px;
        background: rgba(255,255,255,0.3);
        z-index: 101;
    }
    
    #tt-progress-bar {
        height: 100%;
        width: 0%;
        background: white;
        transition: width 0.1s linear;
    }
</style>
`;

if (!playerStr.includes('tiktok-overlay')) {
    playerStr = playerStr.replace('</style>', tiktokStyles);
}

const tiktokHtml = `
        <div id="tiktok-overlay">
            <div id="tt-brand">@<span id="tt-brand-name">Brand</span> <span id="tt-pr-badge">PR</span></div>
            <div id="tt-title">Title Here #Ad</div>
        </div>
        <div id="tt-progress-container">
            <div id="tt-progress-bar"></div>
        </div>

        <video id="video-screen" playsinline muted></video>
`;

if (!playerStr.includes('id="tiktok-overlay"')) {
    playerStr = playerStr.replace('<video id="video-screen" playsinline muted></video>', tiktokHtml);
}

const tiktokLogic = `
            // TikTok Overlay Logic
            const ttOverlay = document.getElementById('tiktok-overlay');
            const ttBrand = document.getElementById('tt-brand-name');
            const ttTitle = document.getElementById('tt-title');
            const ttBadge = document.getElementById('tt-pr-badge');
            
            if (item.is_image || item.is_youtube) {
                ttOverlay.style.display = 'none';
                document.getElementById('tt-progress-container').style.display = 'none';
            } else {
                ttOverlay.style.display = 'block';
                document.getElementById('tt-progress-container').style.display = 'block';
                
                ttBrand.innerText = item.brand || 'Creator';
                ttTitle.innerText = item.title || '配信動画';
                
                // Determine PR/AD Badge
                if (item.brand && item.brand !== 'Creator') {
                    ttBadge.innerText = '広告';
                    ttBadge.className = 'tt-ad-badge';
                    ttBadge.style.display = 'inline-block';
                } else if (item.brand === 'Creator' && item.url) { // If creator and has link or something, maybe PR. To be safe, label as 'PR' if it's an affiliate video
                    ttBadge.innerText = 'PR';
                    ttBadge.className = '';
                    ttBadge.style.display = 'inline-block';
                } else {
                    ttBadge.style.display = 'none';
                }
            }
            video.src = item.url;
`;

if (!playerStr.includes('ttOverlay.style.display')) {
    playerStr = playerStr.replace('video.src = item.url;', tiktokLogic);
    
    // Add timeupdate listener for progress bar
    const progressListener = `
        video.addEventListener('timeupdate', () => {
            const bar = document.getElementById('tt-progress-bar');
            if (video.duration) {
                const percent = (video.currentTime / video.duration) * 100;
                bar.style.width = percent + '%';
            }
        });
        
        video.onended = () => {`;
    playerStr = playerStr.replace('video.onended = () => {', progressListener);
}

fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/signage_player.html', playerStr, 'utf8');
console.log('Done script');

with open('signage_player.html', 'r', encoding='utf-8') as f:
    text = f.read()

target1 = '''        function playContent(item) {
        console.log(`[Signage Player] Starting playback for item: ${item.title} (ID: ${item.id}, Type: ${item.youtube_url ? 'YouTube' : 'Local File'})`);'''
replacement1 = '''        function playContent(item) {
        if (window.videoTimeoutId) { clearTimeout(window.videoTimeoutId); window.videoTimeoutId = null; }
        console.log(`[Signage Player] Starting playback for item: ${item.title} (ID: ${item.id}, Type: ${item.youtube_url ? 'YouTube' : 'Local File'})`);'''
text = text.replace(target1, replacement1)


target2 = '''            video.play().catch(e => {
                const currentItem = currentPlaylist[currentIndex];'''
replacement2 = '''            video.play().then(() => {
                if (item.time_limit) {
                    console.log(`[Player] Time limit is ENABLED for this local video. Setting 120s timeout.`);
                    window.videoTimeoutId = setTimeout(() => {
                        if (currentPlaylist[currentIndex] === item) {
                            console.log(`[Player] Local video reached max duration of 120s. Force skipping.`);
                            playNext();
                        }
                    }, 120000);
                }
            }).catch(e => {
                const currentItem = currentPlaylist[currentIndex];'''
text = text.replace(target2, replacement2)

with open('signage_player.html', 'w', encoding='utf-8') as f:
    f.write(text)

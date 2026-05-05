import re

files = [
    'c:/Users/one/Desktop/RetailMedia_System/signage_player.html',
    'c:/Users/one/Desktop/RetailMedia_System/ad_dashboard.html',
    'c:/Users/one/Desktop/RetailMedia_System/advertiser_dashboard.html',
    'c:/Users/one/Desktop/RetailMedia_System/creator_portal.html'
]

for fp in files:
    with open(fp, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Signage Player
    if 'signage_player.html' in fp:
        # Patch fetchPlaylist
        content = content.replace(
            "const res = await fetch(`/api/signage/playlist?location=${location}&storeId=${storeId}`);",
            "console.log(`[Signage API] Requesting playlist from: /api/signage/playlist?location=${location}&storeId=${storeId}`);\n            const res = await fetch(`/api/signage/playlist?location=${location}&storeId=${storeId}`);\n            if (!res.ok) console.error(`[Signage API] Error fetching playlist! Endpoint: /api/signage/playlist, Status: ${res.status} ${res.statusText}`);"
        )
        content = content.replace(
            "const data = await res.json();",
            "const data = await res.json();\n            console.log(`[Signage API] Successfully received playlist data. Total items: ${data.playlist ? data.playlist.length : 0}`);"
        )
        content = content.replace(
            "console.error('Error fetching playlist:', error);",
            "console.error(`[Signage API] Failed to connect to server! Endpoint: /api/signage/playlist. Error: ${error.message}`);"
        )
        content = content.replace(
            "function playContent(item) {",
            "function playContent(item) {\n        console.log(`[Signage Player] Starting playback for item: ${item.title} (ID: ${item.id}, Type: ${item.youtube_url ? 'YouTube' : 'Local File'})`);"
        )
        content = content.replace(
            "fetch(`/api/analytics/track?adId=${adId}&attention=${attention}&skip=${skip}`).catch(err => console.error(\"Beacon Error:\", err));",
            "console.log(`[Analytics API] Sending beacon data for Ad: ${adId} (Attention: ${attention}%, Skip: ${skip})`);\n            fetch(`/api/analytics/track?adId=${adId}&attention=${attention}&skip=${skip}`).then(r => {\n                if(!r.ok) console.error(`[Analytics API] Beacon Failed! Status: ${r.status}`);\n            }).catch(err => console.error(`[Analytics API] Network Error on endpoint /api/analytics/track! Error: ${err.message}`));"
        )

    # 2. Campaign Submissions (ad_dashboard & advertiser_dashboard)
    if 'dashboard.html' in fp:
        content = content.replace(
            "const response = await fetch('/api/campaigns', {",
            "console.log(`[Campaign API] Submitting new campaign data to endpoint: /api/campaigns`);\n            const response = await fetch('/api/campaigns', {"
        )
        content = content.replace(
            "if (response.ok) {",
            "if (response.ok) {\n                console.log(`[Campaign API] Campaign successfully created and sent to signage server!`);"
        )
        content = content.replace(
            "console.error('Submission error:', error);",
            "console.error(`[Campaign API] Network error during campaign creation! Endpoint: /api/campaigns. Error: ${error.message}`);"
        )

    # 3. Creator Portal
    if 'creator_portal.html' in fp:
        content = content.replace(
            "const response = await fetch('/api/creator/upload', {",
            "console.log(`[Creator API] Uploading new creator video to endpoint: /api/creator/upload`);\n                const response = await fetch('/api/creator/upload', {"
        )
        content = content.replace(
            "if (response.ok) {",
            "if (response.ok) {\n                    console.log(`[Creator API] Video successfully uploaded and added to the signage loop!`);"
        )
        content = content.replace(
            "console.error('Error uploading video:', error);",
            "console.error(`[Creator API] Network error during upload! Endpoint: /api/creator/upload. Error: ${error.message}`);"
        )

    with open(fp, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched {fp}")

print("All files patched successfully.")

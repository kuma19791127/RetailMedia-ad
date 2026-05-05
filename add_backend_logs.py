import re

filepath = 'c:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add logging to /api/campaigns
content = content.replace(
    "app.post('/api/campaigns', (req, res) => {",
    "app.post('/api/campaigns', (req, res) => {\n    console.log(`[API /api/campaigns] Received new campaign creation request. Data size: ${JSON.stringify(req.body).length} bytes`);"
)
content = content.replace(
    "res.json({ success: true, campaign: newCampaign, finalUrl: finalUrl });",
    "console.log(`[API /api/campaigns] Successfully processed campaign '${newCampaign.title}' and sent it to signage.`);\n        res.json({ success: true, campaign: newCampaign, finalUrl: finalUrl });"
)

# Add logging to /api/creator/upload
content = content.replace(
    "app.post('/api/creator/upload', (req, res) => {",
    "app.post('/api/creator/upload', (req, res) => {\n    console.log(`[API /api/creator/upload] Received new creator video upload request. Data size: ${JSON.stringify(req.body).length} bytes`);"
)

# Add logging to /api/signage/playlist
content = content.replace(
    "app.get('/api/signage/playlist', (req, res) => {",
    "app.get('/api/signage/playlist', (req, res) => {\n    console.log(`[API /api/signage/playlist] Received playlist fetch request from Store: ${req.query.storeId || 'Unknown'}, Location: ${req.query.location || 'Unknown'}`);"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched backend logs")

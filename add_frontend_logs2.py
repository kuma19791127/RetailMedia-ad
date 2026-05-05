import re

files = [
    'c:/Users/one/Desktop/RetailMedia_System/ad_dashboard.html',
    'c:/Users/one/Desktop/RetailMedia_System/advertiser_dashboard.html',
    'c:/Users/one/Desktop/RetailMedia_System/creator_portal.html'
]

for fp in files:
    with open(fp, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add logs before fetch
    content = re.sub(
        r'(const res = await fetch\(`\$\{API_URL\}/api/campaigns`, \{)',
        r'console.log(`[Campaign API] Submitting new campaign data to endpoint: ${API_URL}/api/campaigns`);\n                        \1',
        content
    )
    # Add logs after success
    content = re.sub(
        r'(if \(!res\.ok\) throw new Error\(\'Failed to create campaign\'\);)',
        r'\1\n                        console.log(`[Campaign API] Campaign successfully created and sent to signage server!`);',
        content
    )
    # Add logs in catch block
    content = re.sub(
        r'(console\.error\(\'Error:\', error\);)',
        r'console.error(`[Campaign API] Network error during campaign creation! Endpoint: /api/campaigns. Error: ${error.message}`);',
        content
    )
    
    # For creator portal
    content = re.sub(
        r'(const res = await fetch\(`\$\{API_URL\}/api/creator/upload`, \{)',
        r'console.log(`[Creator API] Uploading new creator video to endpoint: ${API_URL}/api/creator/upload`);\n                        \1',
        content
    )
    content = re.sub(
        r'(if \(!res\.ok\) throw new Error\(\'Failed to upload video\'\);)',
        r'\1\n                        console.log(`[Creator API] Video successfully uploaded and added to the signage loop!`);',
        content
    )

    with open(fp, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched {fp}")

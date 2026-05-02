import re

files = [
    'c:/Users/one/Desktop/RetailMedia_System/ad_dashboard.html',
    'c:/Users/one/Desktop/RetailMedia_System/advertiser_dashboard.html',
    'c:/Users/one/Desktop/RetailMedia_System/creator_portal.html'
]

for fp in files:
    with open(fp, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Safely remove duration validation by finding the duration logic and commenting out just the validation part
    # Instead of deleting lines, we will just comment out the `if (!isValid) { ... return false; }` blocks.
    content = re.sub(
        r'(if \(!isValid\) \{\s*Swal\.showValidationMessage[^\}]+\}\s*return false;\s*\})',
        r'// Duration validation removed by request\n/* \1 */',
        content,
        flags=re.DOTALL
    )

    # For creator_portal
    content = re.sub(
        r'(if \(duration > 60\) \{\s*Swal\.showValidationMessage[^\}]+\}\s*return false;\s*\})',
        r'// Creator duration limit removed by request\n/* \1 */',
        content,
        flags=re.DOTALL
    )

    # 2. Add logging
    # Campaign Submissions (ad_dashboard & advertiser_dashboard)
    content = re.sub(
        r'(const res = await fetch\(`\$\{API_URL\}/api/campaigns`, \{)',
        r'console.log(`[Campaign API] Submitting new campaign data to endpoint: ${API_URL}/api/campaigns`);\n                        \1',
        content
    )
    content = re.sub(
        r'(if \(!res\.ok\) throw new Error\(\'Failed to create campaign\'\);)',
        r'\1\n                        console.log(`[Campaign API] Campaign successfully created and sent to signage server!`);',
        content
    )
    content = re.sub(
        r'(} catch \(error\) \{\s*console\.error\(\'Error:\', error\);)',
        r'} catch (error) {\n                        console.error(`[Campaign API] Network error during campaign creation! Endpoint: /api/campaigns. Error: ${error.message}`);',
        content
    )
    
    # Creator Portal
    content = re.sub(
        r'(const res = await fetch\(`\$\{API_URL\}/api/creator/upload`, \{)',
        r'console.log(`[Creator API] Uploading new creator video to endpoint: ${API_URL}/api/creator/upload`);\n                \1',
        content
    )
    content = re.sub(
        r'(if \(!res\.ok\) throw new Error\(\'Failed to upload video\'\);)',
        r'\1\n                    console.log(`[Creator API] Video successfully uploaded and added to the signage loop!`);',
        content
    )
    content = re.sub(
        r'(} catch \(error\) \{\s*console\.error\(\'Error:\', error\);)',
        r'} catch (error) {\n                    console.error(`[Creator API] Network error during upload! Endpoint: /api/creator/upload. Error: ${error.message}`);',
        content
    )

    with open(fp, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched safely {fp}")

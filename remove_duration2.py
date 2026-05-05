import os

filepaths = [
    'c:/Users/one/Desktop/RetailMedia_System/ad_dashboard.html',
    'c:/Users/one/Desktop/RetailMedia_System/advertiser_dashboard.html',
    'c:/Users/one/Desktop/RetailMedia_System/creator_portal.html'
]

for filepath in filepaths:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find the block and replace it
        import re
        
        # for ad_dashboard and advertiser_dashboard
        pattern = re.compile(r'const duration = await window\.getVideoDuration\(file\);.*?\} catch \(e\)', re.DOTALL)
        content = pattern.sub('// Duration validation removed\n            } catch (e)', content)
        
        # for creator_portal
        pattern2 = re.compile(r'const duration = await window\.getVideoDuration\(file\);.*?if \(duration > 60\).*?return false;\s*\}', re.DOTALL)
        content = pattern2.sub('// Duration validation removed', content)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Processed", filepath)

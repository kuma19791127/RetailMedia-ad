import glob
import codecs

target_placeholder = "https://api.your-server.com"
app_runner_url = "https://nsg3hyme2k.us-east-1.awsapprunner.com"

count = 0
for f in glob.glob('*.html'):
    try:
        with codecs.open(f, 'r', 'utf-8') as file:
            content = file.read()
            
        if target_placeholder in content:
            content = content.replace(target_placeholder, app_runner_url)
            with codecs.open(f, 'w', 'utf-8') as file:
                file.write(content)
            count += 1
    except Exception as e:
        print(f"Error processing {f}: {e}")

print(f"Updated {count} HTML files with the App Runner URL.")

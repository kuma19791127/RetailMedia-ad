import os

old_url = 'nsg3hyme2k.us-east-1.awsapprunner.com'
new_url = 'api.retail-ad.com'

files = [f for f in os.listdir('.') if f.endswith('.html')]

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if old_url in content:
        print(f"Replacing in {file}...")
        new_content = content.replace(old_url, new_url)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)

print("Replacement complete.")

import os

old_str = "input.includes('awsapprunner.com')"
new_str = "input.includes('awsapprunner.com') || input.includes('retail-ad.com')"

files = [f for f in os.listdir('.') if f.endswith('.html')]

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if old_str in content:
        print(f"Replacing in {file}...")
        new_content = content.replace(old_str, new_str)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)

print("Replacement complete.")

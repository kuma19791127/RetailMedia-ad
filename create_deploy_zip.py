import zipfile
import os
import glob

def create_zip():
    files_to_zip = [
        'server_retail_dist.js',
        'package.json',
        '.env',
        'database.json'
    ]
    
    # Also include any other backend JS files, but avoid frontend HTML to keep it small
    # Actually, server_retail_dist.js serves the frontend HTML too right now using express.static
    # Let's just zip everything except node_modules, .git, and large unnecessary folders
    
    with zipfile.ZipFile('backend_deploy.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk('.'):
            if 'node_modules' in root or '.git' in root or '__pycache__' in root:
                continue
            for file in files:
                if file.endswith('.zip') or file.endswith('.png') or file.endswith('.mp4'):
                    continue # skip media and zips
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, '.')
                zipf.write(file_path, arcname)
                
    print(f"Created backend_deploy.zip with size {os.path.getsize('backend_deploy.zip')} bytes")

if __name__ == '__main__':
    create_zip()

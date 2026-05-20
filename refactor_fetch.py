import glob
import re
import codecs

header_script = """
    <!-- === API Base URL Config === -->
    <script>
        window.API_BASE_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:') 
            ? 'http://localhost:3000' 
            : 'https://api.your-server.com'; // TODO: 本番環境のバックエンドURLに変更してください
    </script>
"""

for f in glob.glob('*.html'):
    try:
        with codecs.open(f, 'r', 'utf-8') as file:
            content = file.read()
        
        original_content = content
        
        # Inject script block after <head> if not already there
        if 'window.API_BASE_URL' not in content:
            content = re.sub(r'<head>', '<head>\n' + header_script, content, count=1, flags=re.IGNORECASE)
        
        # Replace raw fetches
        content = re.sub(r'fetch\([ \t]*\'/api/', "fetch(window.API_BASE_URL + '/api/", content)
        content = re.sub(r'fetch\([ \t]*\"/api/', 'fetch(window.API_BASE_URL + "/api/', content)
        content = re.sub(r'fetch\([ \t]*\`/api/', 'fetch(window.API_BASE_URL + `/api/', content)
        
        # Override old constants to use the window one so existing logic (e.g. `${API_BASE}/api/`) works seamlessly
        content = re.sub(r'const\s+API_BASE\s*=\s*[^;]+;', 'const API_BASE = window.API_BASE_URL;', content)
        content = re.sub(r'const\s+API_URL\s*=\s*[^;]+;', 'const API_URL = window.API_BASE_URL;', content)
        
        # Exception fixes for specific files that might have it defined differently
        # e.g., const API_URL = ... ? '...' : '' without semicolon (though rare, we can catch it with a broader regex if needed)
        
        if content != original_content:
            with codecs.open(f, 'w', 'utf-8') as file:
                file.write(content)
            print(f"Updated {f}")
    except Exception as e:
        print(f"Error processing {f}: {e}")

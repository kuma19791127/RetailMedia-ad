import os
import sys

# Ensure UTF-8 output on Windows
if sys.platform.startswith('win'):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

endpoints = ['/api/auth/login', '/api/auth/register', '/api/auth/2fa/setup', '/api/auth/2fa/enable', '/api/auth/2fa/verify', '/api/auth/reset-2fa', '/api/auth/reset-password']

def scan_files():
    html_files = [f for f in os.listdir('.') if f.endswith('.html')]
    for filename in html_files:
        with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            for ep in endpoints:
                if ep in content:
                    print(f"=== Found {ep} in {filename} ===")
                    lines = content.split('\n')
                    for i, line in enumerate(lines):
                        if ep in line:
                            start = max(0, i - 5)
                            end = min(len(lines), i + 10)
                            print(f"Lines {start+1}-{end}:")
                            for idx in range(start, end):
                                print(f"  {idx+1}: {lines[idx]}")
                            print("-" * 50)

if __name__ == '__main__':
    scan_files()

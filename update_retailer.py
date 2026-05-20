import codecs
import re

filename = 'retailer_portal.html'
try:
    with codecs.open(filename, 'r', 'utf-8') as f:
        text = f.read()
        
    if 'remove_retail_signage.bat' not in text and 'setup_retail_signage.bat' in text:
        text = re.sub(r'(<a href="[^"]*setup_retail_signage\.bat"[^>]*>.*?</a>)', 
                      r'\1\n            <a href="https://retail-media-db-2026.s3.us-east-1.amazonaws.com/remove_retail_signage.bat" download style="margin-top:10px; margin-bottom:10px; margin-left:10px; background:#64748b; color:white; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer; display:inline-block; text-decoration:none;"><i class="fa-solid fa-rotate-left"></i> 解除ツール</a>', 
                      text)
            
    if 'function sendDownloadLink()' not in text:
        script_block = '''
    function sendDownloadLink() {
        const subject = encodeURIComponent("リテアド サイネージ自動セットアップアプリのご案内");
        const body = encodeURIComponent(`サイネージ端末のセットアップ用リンクです。
以下のリンクから専用アプリまたは設定ファイルをダウンロードして実行してください。

■ Android端末（タブレット・TV等）をご利用の場合
Android専用セットアップアプリ（APK）
https://retail-media-db-2026.s3.us-east-1.amazonaws.com/RetailAd_Signage.apk

■ Windowsパソコンをご利用の場合
Windows用自動セットアップツール（.bat）
https://retail-media-db-2026.s3.us-east-1.amazonaws.com/setup_retail_signage.bat

※設定を元に戻す場合はこちらの解除ツールを実行してください。
https://retail-media-db-2026.s3.us-east-1.amazonaws.com/remove_retail_signage.bat`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
'''
        text = text.replace('</script>\n</head>', script_block + '</script>\n</head>')
        
    with codecs.open(filename, 'w', 'utf-8') as f:
        f.write(text)
    print('retailer_portal.html updated successfully')
except Exception as e:
    print(f'Error processing {filename}: {e}')

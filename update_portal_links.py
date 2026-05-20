import codecs
import re

for filename in ['store_portal.html', 'anywhere_retail.html']:
    try:
        with codecs.open(filename, 'r', 'utf-8') as f:
            text = f.read()
            
        # Add remove_retail_signage button
        if 'remove_retail_signage.bat' not in text and 'setup_retail_signage.bat' in text:
            setup_btn = r'<a href="https://retail-media-db-2026.s3.us-east-1.amazonaws.com/setup_retail_signage.bat" download style="margin-top:10px; margin-bottom:10px; background:#10b981; color:white; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer; display:inline-block; text-decoration:none;"><i class="fa-brands fa-windows"></i> ダウンロード</a>'
            remove_btn = r'<a href="https://retail-media-db-2026.s3.us-east-1.amazonaws.com/remove_retail_signage.bat" download style="margin-top:10px; margin-bottom:10px; margin-left:10px; background:#64748b; color:white; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer; display:inline-block; text-decoration:none;"><i class="fa-solid fa-rotate-left"></i> 解除ツール</a>'
            if setup_btn in text:
                text = text.replace(setup_btn, setup_btn + '\n            ' + remove_btn)
            else:
                # regex replace just in case styles differ slightly
                text = re.sub(r'(<a href="[^"]*setup_retail_signage\.bat"[^>]*>.*?</a>)', r'\1\n            <a href="https://retail-media-db-2026.s3.us-east-1.amazonaws.com/remove_retail_signage.bat" download style="margin-top:10px; margin-bottom:10px; margin-left:10px; background:#64748b; color:white; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer; display:inline-block; text-decoration:none;"><i class="fa-solid fa-rotate-left"></i> 解除ツール</a>', text)
                
        # Add sendDownloadLink function
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
            # insert before closing </script> in head or body
            text = text.replace('</script>\n</head>', script_block + '</script>\n</head>')
            
        with codecs.open(filename, 'w', 'utf-8') as f:
            f.write(text)
    except Exception as e:
        print(f"Error processing {filename}: {e}")

print('HTML portals updated')

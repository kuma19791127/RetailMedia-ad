# -*- coding: utf-8 -*-
import os

files = [
    r"c:\Users\one\.gemini\antigravity\playground\twilight-parsec\store_portal.html",
    r"c:\Users\one\.gemini\antigravity\playground\twilight-parsec\retailer_portal.html"
]

target_code = """                    function getAndroidInstructionsContent(storeId, terminalId) {
                        return `=========================================================\\r\\nリテアド・サイネージ Androidアプリ導入・セットアップ手順書\\r\\n=========================================================\\r\\n\\r\\nこのファイルは、既存のAndroidサイネージパネル（Android OS搭載）に\\r\\n「リテアド・サイネージプレイヤー」アプリを導入し、セットアップするための手順書です。\\r\\n\\r\\n【店舗設定ID情報】\\r\\n店舗固有ID: ${storeId}\\r\\n端末固有ID: ${terminalId}\\r\\n\\r\\n---------------------------------------------------------\\r\\n■ セットアップ手順\\r\\n---------------------------------------------------------\\r\\n1. サイネージ用Android端末のブラウザ等から、リテアド・サイネージプレイヤー\\r\\n   アプリ (APKファイル) をダウンロード・インストールします。\\r\\n   （※事前に本部から案内された専用URL、または公式ストアからインストールしてください）\\r\\n\\r\\n2. インストールしたアプリを起動します。\\r\\n\\r\\n3. 初回起動時に表示される「店舗ID入力画面」において、\\r\\n   上記の店舗固有ID【 ${storeId} 】を入力してください。\\r\\n\\r\\n4. 続けて端末ID（またはサイネージID）入力画面が表示された場合は、\\r\\n   上記の端末固有ID【 ${terminalId} 】を入力してください。\\r\\n\\r\\n5. 「保存」または「接続」ボタンをタップすると、サーバーから最新の広告・動画\\r\\n   プレイリストが同期され、自動的にフルスクリーン再生が開始されます。\\r\\n\\r\\n---------------------------------------------------------\\r\\n■ 注意事項\\r\\n---------------------------------------------------------\\r\\n・端末の電源を入れた際、自動的にリテアドアプリが起動する「自動起動（Auto Start）設定」を\\r\\n  Android端末本体の設定メニュー等で有効にしておくことを推奨します。\\r\\n・インターネット接続が常時確保されていることをご確認ください。\\r\\n`;
                    }"""

replacement_code = """                    function getAndroidInstructionsContent(storeId, terminalId) {
                        const termId = terminalId || "%TERMINAL_ID%";
                        return `=========================================================\\r\\nリテアド・サイネージ Androidアプリ導入・セットアップ手順書\\r\\n=========================================================\\r\\n\\r\\nこのファイルは、既存のAndroidサイネージパネル（Android OS搭載）に\\r\\n「リテアド・サイネージプレイヤー」アプリを導入し、セットアップするための手順書です。\\r\\n\\r\\n【店舗設定ID情報】\\r\\n店舗固有ID: ${storeId}\\r\\n端末固有ID: ${termId}\\r\\n\\r\\n---------------------------------------------------------\\r\\n■ セットアップ手順（自動設定）\\r\\n---------------------------------------------------------\\r\\n1. サイネージ用Android端末のブラウザ等から、リテアド・サイネージプレイヤー\\r\\n   アプリ (APKファイル) をダウンロード・インストールします。\\r\\n   （※事前に本部から案内された専用URL、または公式ストアからインストールしてください）\\r\\n\\r\\n2. インストール完了後、以下の【自動セットアップ起動リンク】をAndroid端末のブラウザ等でタップして（またはQRコードから）起動します。\\r\\n\\r\\n   【自動セットアップ起動リンク】\\r\\n   litead://setup?storeId=${storeId}&terminal_id=${termId}\\r\\n\\r\\n3. アプリが自動で起動し、店舗ID【 ${storeId} 】および端末ID【 ${termId} 】が自動入力された状態で、即座にサイネージのフルスクリーン再生が開始されます。\\r\\n   （※手動でIDを入力する必要はありません）\\r\\n\\r\\n---------------------------------------------------------\\r\\n■ 注意事項\\r\\n---------------------------------------------------------\\r\\n・端末の電源を入れた際、自動的にリテアドアプリが起動する「自動起動（Auto Start）設定」を\\r\\n  Android端末本体の設定メニュー等で有効にしておくことを推奨します。\\r\\n・インターネット接続が常時確保されていることをご確認ください。\\r\\n`;
                    }"""

# retailer_portal.html のインデントが異なる可能性があるので個別に処理
target_code_retailer = target_code.replace("                    ", "")
replacement_code_retailer = replacement_code.replace("                    ", "")

for file_path in files:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    is_crlf = "\\r\\n" in content
    normalized_content = content.replace("\\r\\n", "\\n")
    
    # 標準インデントで置換
    t = target_code.replace("\\r\\n", "\\n")
    r = replacement_code.replace("\\r\\n", "\\n")
    
    # インデントなしで置換（リテーラーポータルのインデントずれ対応）
    t_ret = target_code_retailer.replace("\\r\\n", "\\n")
    r_ret = replacement_code_retailer.replace("\\r\\n", "\\n")
    
    if t in normalized_content:
        normalized_content = normalized_content.replace(t, r)
        print(f"SUCCESS: Patched standard indent in {os.path.basename(file_path)}")
    elif t_ret in normalized_content:
        normalized_content = normalized_content.replace(t_ret, r_ret)
        print(f"SUCCESS: Patched retailer indent in {os.path.basename(file_path)}")
    else:
        # 文字列の部分一致や改行不一致を回避するため、大雑把な置換を試みる
        # "function getAndroidInstructionsContent" から "`;\\n                    }" までの範囲を正規表現で置換
        import re
        pattern = re.compile(r'function getAndroidInstructionsContent\\(storeId, terminalId\\)\\s*\\{.*?\\`\\;\\s*\\}', re.DOTALL)
        if pattern.search(normalized_content):
            # リテーラー側のインデントに対応するため、インデントなし版を代入するか、元のコードのインデントを維持する
            # ここでは replacement_code を適切に埋め込む
            indent = "                    " if "store_portal" in file_path else ""
            indented_replacement = replacement_code if "store_portal" in file_path else replacement_code_retailer
            normalized_content = pattern.sub(indented_replacement.replace("\\r\\n", "\\n"), normalized_content)
            print(f"SUCCESS: Patched via regex in {os.path.basename(file_path)}")
        else:
            print(f"ERROR: Target block not found in {os.path.basename(file_path)}")
            
    final_content = normalized_content.replace("\\n", "\\r\\n") if is_crlf else normalized_content
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(final_content)

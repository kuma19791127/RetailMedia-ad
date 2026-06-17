import os

file_path = 'retailer_portal.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start and end of the block using comments
start_marker = '<!-- Service & Workflow Guide -->'
end_marker = '<!-- UI Selection: Single Store or Bulk Store -->'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    replacement_block = """<!-- Service & Workflow Guide -->
            <div class="card" style="padding:25px; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.05); border:1px solid #e2e8f0; margin-bottom:25px; background:#ffffff;">
                <h2 style="color:#1e3a8a; border-bottom:2px solid #2563eb; font-size:1.35rem; margin-top:0; padding-bottom:10px; display:flex; align-items:center; gap:8px;">
                    <span>ℹ️</span> 1クリック自動配信型 サイネージ初期設定サービスのご案内
                </h2>
                <div style="font-size:0.95rem; color:#334155; line-height:1.8; margin-bottom:20px;">
                    <p style="margin-top:0; margin-bottom:15px; font-weight:500;">
                        本サービスは、「各店舗へメール一括自動送信」を行うことで、本部の配信業務および店舗現場の導入設定作業を全自動化する配信システムです。
                    </p>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:15px; margin-bottom:15px;">
                        <strong style="color:#2563eb; display:block; margin-bottom:8px; font-size:0.95rem;">💡 特徴とセキュリティ機能</strong>
                        <ul style="margin:0; padding-left:20px; font-size:0.9rem; line-height:1.7;">
                            <li>通常の液晶モニターサイネージに加え、透過型LED「リテアド LEDフィルムサイネージ（Android／Win等）」の初期セットアップに完全対応しています。</li>
                            <li>店舗ごとの固有IDが埋め込まれた専用バッチファイル（および解除用バッチ）が自動生成され、各店舗へ自動送信されます。</li>
                            <li>ファイルの送付ミスや店舗間での設定ファイルの取り違えを完全に防止します。</li>
                            <li>セキュリティ制限（USBポート無効化、自動キオスク起動設定）を安全かつ迅速に行うことができます。</li>
                        </ul>
                    </div>
                </div>
                
                <div class="setup-steps-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:30px; border-top:1px solid #e2e8f0; padding-top:20px;">
                    <div style="background:#f0f7ff; padding:18px; border-radius:8px; border:1px solid #dbeafe;">
                        <strong style="color:#2563eb; display:block; margin-bottom:12px; font-size:1rem; border-bottom:2px solid #dbeafe; padding-bottom:6px;">🏢 本部（マーケティング部）の作業ステップ</strong>
                        <ol style="font-size:0.875rem; color:#475569; padding-left:20px; line-height:1.8; margin:0;">
                            <li style="margin-bottom:10px;">
                                <b>宛先リストの準備：</b><br>
                                Excelやテキスト等から「店舗ID, メールアドレス」の作成したリスト（例: LIFE_001, store001@example.com）をコピーします。
                            </li>
                            <li style="margin-bottom:10px;">
                                <b>リストの貼り付け：</b><br>
                                「大店舗向け一括発行」タブに切り替え、入力エリアにコピーしたリストをそのまま貼り付けます。
                            </li>
                            <li style="margin-bottom:0;">
                                <b>1クリック自動送信：</b><br>
                                「各店舗へセットアップ資材を一斉メール送信する」ボタンをクリックします。システムが各店舗用の専用バッチファイルを自動生成し、指定メールアドレスへ一括送信します。
                            </li>
                        </ol>
                    </div>
                    <div style="background:#f0fdf4; padding:18px; border-radius:8px; border:1px solid #dcfce7;">
                        <strong style="color:#10b981; display:block; margin-bottom:12px; font-size:1rem; border-bottom:2px solid #dcfce7; padding-bottom:6px;">🏪 現場（各店舗スタッフ）の作業ステップ</strong>
                        <p style="font-size:0.825rem; color:#64748b; margin-top:0; margin-bottom:10px; line-height:1.5;">
                            店舗に導入されているサイネージ設備の環境に合わせて、フォルダ内のファイルまたは手順を選択して設定します。
                        </p>
                        <ol style="font-size:0.875rem; color:#475569; padding-left:20px; line-height:1.8; margin:0;">
                            <li style="margin-bottom:10px;">
                                <b>設定用メールの受信：</b><br>
                                本部から届いたメール（店舗用フォルダ）を開きます。
                            </li>
                            <li style="margin-bottom:10px;">
                                <b>導入環境に合わせたファイルの選択：</b><br>
                                以下の導入環境パターンから、店舗のサイネージ機器に該当する手順を選択します。（※web接続できるサイネージパネルのみ）
                                <ul style="padding-left:15px; margin-top:5px; margin-bottom:5px; list-style-type:circle;">
                                    <li style="margin-bottom:8px;">
                                        <b>1. リテアド：LEDフィルムサイネージ（専用アプリ方式・方式1）をご利用の場合：</b><br>
                                        <span style="color:#10b981; font-weight:bold;">➡ 現場での設定作業は不要です。</span><br>
                                        出荷時に店舗IDが設定済みのため、電源を入れるだけで自動起動し、サイネージが開始されます。
                                    </li>
                                    <li style="margin-bottom:8px;">
                                        <b>2. Android端末をご利用の場合：</b><br>
                                        Androidアプリとサイネージパネルの自動セットアップを行います。<br>
                                        既存のAndroidコントローラーやサイネージパネルで運用する場合、androidを初期化してQRコードを読み込ませることで、自動設定が行われます。<br>
                                        <a href="app_setup_guide.html" target="_blank" style="display:inline-block; margin-top:5px; color:#2563eb; text-decoration:underline; font-size:0.85rem; font-weight:bold;"><i class="fa-solid fa-file-lines"></i> 🤖 Android専用アプリ設定ガイド</a>
                                    </li>
                                    <li style="margin-bottom:8px;">
                                        <b>3. Windows PC端末をご利用の場合：</b><br>
                                        Win PCをサイネージ化する場合、送付されたフォルダ内の `setup_店舗ID.bat` を右クリックして「管理者として実行」します。自動キオスク起動設定などが全自動で適用されます。
                                    </li>
                                </ul>
                            </li>
                            <li style="margin-bottom:0;">
                                <b>設定完了の確認：</b><br>
                                自動的に広告動画の同期とループ再生が開始されます。
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
            
            """
    
    new_content = content[:start_idx] + replacement_block + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("BLOCK REPLACEMENT SUCCESSFUL!")
else:
    print(f"MARKERS NOT FOUND: start={start_idx != -1}, end={end_idx != -1}")

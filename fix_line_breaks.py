import re

# store_portal.html
with open('store_portal.html', 'r', encoding='utf-8') as f:
    text = f.read()

target1 = re.compile(r'<p>\s*Android搭載のサイネージパネルやタブレットに専用アプリをインストールするだけで、<br>\s*自動的にサイネージとして登録され、広告事業が開始されます。\s*</p>')
replacement1 = '''<p>
                    Android搭載のサイネージパネルや<br>
                    タブレットに専用アプリをインストールするだけで<br>
                    自動的にサイネージとして登録され<br>
                    広告事業が開始されます。
                </p>'''
text = target1.sub(replacement1, text)

target2 = re.compile(r'<p style="font-size:0\.85rem; color:#34495e; line-height:1\.6; background: #ecfdf5; padding: 15px; border-radius: 6px; margin-top: 10px;">\s*<strong style="color: #047857;">💡 停電時の自動復旧について</strong><br>\s*Androidアプリ「RetailMedia Signage」は、端末起動時に自動で立ち上がる設定が可能です。<br>\s*そのため停電などで電源が落ちた場合でも、電気が復旧して端末が再起動されれば、<br>\s*スタッフが一切操作をしなくても自動的にサイネージの放映が自動再開されます。\s*</p>')
replacement2 = '''<p style="font-size:0.85rem; color:#34495e; line-height:1.6; background: #ecfdf5; padding: 15px; border-radius: 6px; margin-top: 10px;">
                  <strong style="color: #047857;">💡 停電時の自動復旧について</strong><br>
                  Androidアプリ「RetailMedia Signage」は<br>
                  端末起動時に自動で立ち上がる<br>
                  設定が可能です。<br>
                  そのため停電などで電源が落ちた場合でも<br>
                  電気が復旧して端末が再起動されれば<br>
                  自動的にサイネージ配信が<br>
                  自動再開されます。
                </p>'''
text = target2.sub(replacement2, text)

target3 = re.compile(r'<ol style="margin:0; padding-left:20px; line-height:1\.8; color:#334155;">.*?</ol>', re.DOTALL)
replacement3 = '''<ol style="margin:0; padding-left:20px; line-height:1.8; color:#334155;">
                        <li><span style="font-weight:bold; color:#e74c3c;">必ずサイネージパネル<br>
                            （Android端末）をWi-Fi等の<br>
                            インターネットに<br>
                            接続してください。</span><br>
                            <span style="font-size:0.8rem; color:#64748b;">※USBやSDカードのみで運用する<br>
                            「オフライン専用サイネージパネル」では<br>
                            ご利用できません。</span>
                        </li>
                        <li>専用のダウンロードリンクから<br>
                            「RetailMedia Signage」<br>
                            アプリ（APKファイル）を<br>
                            インストールします。<br>
                            <button onclick="sendDownloadLink()" style="margin-top:10px; background:#3b82f6; color:white; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;">📧 アプリのダウンロードリンクを送信する</button>
                        </li>
                        <li>アプリを起動するだけで<br>
                            完了です！<br>
                            <span style="font-size:0.8rem; color:#64748b;">※端末の固有IDにより<br>
                            自動で店舗と紐付きます。<br>
                            面倒な店舗IDの入力等は<br>
                            一切不要です！</span>
                        </li>
                    </ol>'''
text = target3.sub(replacement3, text)

target4 = re.compile(r'<p style="font-size:0\.8rem; color:#64748b; margin-top:10px;">※サイネージ端末のメールアドレス宛にインストール用URLを送信します。</p>')
replacement4 = '''<p style="font-size:0.8rem; color:#64748b; margin-top:10px;">※サイネージ端末のメールアドレス宛に<br>インストール用URLを送信します。</p>'''
text = target4.sub(replacement4, text)

with open('store_portal.html', 'w', encoding='utf-8') as f:
    f.write(text)


# retailer_portal.html
with open('retailer_portal.html', 'r', encoding='utf-8') as f:
    text2 = f.read()

target2_rt = re.compile(r'<p style="font-size:0\.85rem; color:#34495e; line-height:1\.6; background: #ecfdf5; padding: 15px; border-radius: 6px; margin-top: 10px;">\s*<strong style="color: #047857;">💡 停電時の自動復旧について</strong><br>\s*Androidアプリ「RetailMedia Signage」は、端末起動時に自動で立ち上がる設定が可能です。<br>\s*そのため停電などで電源が落ちた場合でも、電気が復旧して端末が再起動されれば、<br>\s*スタッフが一切操作をしなくても自動的にサイネージの放映が自動再開されます。\s*</p>')
text2 = target2_rt.sub(replacement2, text2)

target3_rt = re.compile(r'<ol style="margin:0; padding-left:20px; line-height:1\.8; color:#334155;">.*?</ol>', re.DOTALL)
replacement3_rt = '''<ol style="margin:0; padding-left:20px; line-height:1.8; color:#334155;">
                        <li><span style="font-weight:bold; color:#e74c3c;">必ずサイネージパネル<br>
                            （Android端末）をWi-Fi等の<br>
                            インターネットに<br>
                            接続してください。</span><br>
                            <span style="font-size:0.8rem; color:#64748b;">※USBやSDカードのみで運用する<br>
                            「オフライン専用サイネージパネル」では<br>
                            ご利用できません。</span>
                        </li>
                        <li>専用のダウンロードリンクから<br>
                            「RetailMedia Signage」<br>
                            アプリ（APKファイル）を<br>
                            インストールします。<br>
                            <button onclick="sendDownloadLink()" style="margin-top:10px; margin-bottom:10px; background:#3b82f6; color:white; border:none; padding:8px 15px; border-radius:5px; font-weight:bold; cursor:pointer;">📧 アプリのダウンロードリンクを送信する</button>
                        </li>
                        <li>アプリを起動するだけで<br>
                            完了です！<br>
                            <span style="font-size:0.8rem; color:#64748b;">※端末の固有IDにより<br>
                            自動で店舗と紐付きます。<br>
                            面倒な店舗IDの入力等は<br>
                            一切不要です！</span>
                        </li>
                    </ol>'''
text2 = target3_rt.sub(replacement3_rt, text2)

# In retailer_portal.html, let's also replace the first block if it exists, or just the "店舗への設定案内" paragraph
target_intro = re.compile(r'<p>店舗のサイネージパネル・モニターで動画を再生するための準備です。</p>')
replacement_intro = '''<p>
                    Android搭載のサイネージパネルや<br>
                    タブレットに専用アプリをインストールするだけで<br>
                    自動的にサイネージとして登録され<br>
                    広告事業が開始されます。
                </p>'''
text2 = target_intro.sub(replacement_intro, text2)

with open('retailer_portal.html', 'w', encoding='utf-8') as f:
    f.write(text2)

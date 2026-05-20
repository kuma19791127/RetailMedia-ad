import codecs
import re

with codecs.open('setup_retail_signage.bat', 'r', 'cp932') as f:
    text = f.read()

new_vbs_logic = r'''
set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
set "EDGE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

if exist "%CHROME_PATH%" (
    set "BROWSER_PATH=%CHROME_PATH%"
    echo [OK] Google Chrome を使用します。
) else (
    set "BROWSER_PATH=%EDGE_PATH%"
    echo [OK] Microsoft Edge を使用します。
)

:: ブラウザをキオスクモードで起動するショートカットを作成 (VBScriptを使用)
set "VBS_SCRIPT=%TEMP%\CreateShortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%VBS_SCRIPT%"
echo sLinkFile = "%SHORTCUT_PATH%" >> "%VBS_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%VBS_SCRIPT%"
echo oLink.TargetPath = "%BROWSER_PATH%" >> "%VBS_SCRIPT%"
echo oLink.Arguments = "--kiosk ""%TARGET_URL%"" --kiosk-type=fullscreen" >> "%VBS_SCRIPT%"
echo oLink.Save >> "%VBS_SCRIPT%"
'''

text = re.sub(r':: Edgeをキオスクモード.*?echo oLink\.Save >> \"%VBS_SCRIPT%\"', new_vbs_logic.strip(), text, flags=re.DOTALL)
text = text.replace('Microsoft Edgeのキオスクモード自動起動ショートカットを作成しました。', 'ブラウザのキオスクモード自動起動ショートカットを作成しました。')

with codecs.open('setup_retail_signage.bat', 'w', 'cp932') as f:
    f.write(text.replace('\r\n', '\n').replace('\n', '\r\n'))

print('Updated bat to prefer Chrome over Edge')

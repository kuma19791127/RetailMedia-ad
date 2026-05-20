import win32com.client
import os

path = os.environ.get('ALLUSERSPROFILE') + r'\Microsoft\Windows\Start Menu\Programs\Startup\RetailAd_Signage.lnk'

try:
    shell = win32com.client.Dispatch("WScript.Shell")
    shortcut = shell.CreateShortCut(path)
    print("TargetPath:", shortcut.TargetPath)
    print("Arguments:", shortcut.Arguments)
except Exception as e:
    print(e)

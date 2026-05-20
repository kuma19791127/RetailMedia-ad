Set oWS = WScript.CreateObject("WScript.Shell")
Set oLink = oWS.CreateShortcut(WScript.Arguments(0))
WScript.Echo "TargetPath: " & oLink.TargetPath
WScript.Echo "Arguments: " & oLink.Arguments

Set objExcel = CreateObject("Excel.Application")
objExcel.Visible = True
objExcel.DisplayAlerts = False

Set objWorkbook = objExcel.Workbooks.Add()
Set objSheet = objWorkbook.Sheets(1)
objSheet.Name = "シフト管理"

objSheet.Cells(1, 1).Value = "下のボタンを押して、サーバーからシフトデータを取得します"
objSheet.Columns("A").ColumnWidth = 60

' Create a Button
Set objButton = objSheet.Buttons.Add(20, 30, 150, 40)
objButton.Characters.Text = "シフトデータを同期"
objButton.OnAction = "GetShiftData"

' Create the VBA Module
On Error Resume Next
Set objVBProject = objWorkbook.VBProject
If Err.Number <> 0 Then
    MsgBox "Excelのセキュリティ設定でマクロの自動生成がブロックされています。" & vbCrLf & _
           "Excelの「開発」タブが表示されていないか、マクロへのアクセスが許可されていません。", vbCritical, "エラー"
    objExcel.Quit
    WScript.Quit
End If
On Error GoTo 0

Set objVBComponent = objVBProject.VBComponents.Add(1) ' 1 = vbext_ct_StdModule
objVBComponent.CodeModule.AddFromString _
    "Sub GetShiftData()" & vbCrLf & _
    "    Dim http As Object" & vbCrLf & _
    "    Set http = CreateObject(""MSXML2.XMLHTTP"")" & vbCrLf & _
    "    Dim url As String" & vbCrLf & _
    "    url = ""http://localhost:3000/api/shift/state""" & vbCrLf & _
    "    On Error GoTo ErrorHandler" & vbCrLf & _
    "    http.Open ""GET"", url, False" & vbCrLf & _
    "    http.send" & vbCrLf & _
    "    If http.Status = 200 Then" & vbCrLf & _
    "        Dim jsonText As String" & vbCrLf & _
    "        jsonText = http.responseText" & vbCrLf & _
    "        Sheets(1).Cells(4, 1).Value = ""【取得完了】サーバーの最新シフトデータ:""" & vbCrLf & _
    "        Sheets(1).Cells(5, 1).Value = jsonText" & vbCrLf & _
    "        MsgBox ""シフトデータをサーバーから正常に取得しました！"", vbInformation, ""連携完了""" & vbCrLf & _
    "    Else" & vbCrLf & _
    "        MsgBox ""サーバーへの通信に失敗しました。Status: "" & http.Status, vbCritical, ""エラー""" & vbCrLf & _
    "    End If" & vbCrLf & _
    "    Exit Sub" & vbCrLf & _
    "ErrorHandler:" & vbCrLf & _
    "    MsgBox ""エラーが発生しました。Node.jsサーバーが起動しているか確認してください。"", vbCritical, ""通信エラー""" & vbCrLf & _
    "End Sub"

savePath = "C:\Users\one\Desktop\RetailMedia_System\シフト抽出・連携マクロ.xlsm"
objWorkbook.SaveAs savePath, 52 ' 52 = xlOpenXMLWorkbookMacroEnabled
MsgBox "「シフト抽出・連携マクロ.xlsm」を自動生成しました！", vbInformation, "完了"

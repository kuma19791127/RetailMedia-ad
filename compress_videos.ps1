$ErrorActionPreference = 'Stop'
$sourceFolder = "C:\Users\one\Desktop\RetailMedia_System"
Write-Host "圧縮対象の大きな動画ファイルを探しています..."

Get-ChildItem -Path $sourceFolder -Recurse -Filter "*.mp4" | Where-Object { $_.Length -gt 20MB } | ForEach-Object {
    $inputFile = $_.FullName
    $outputFile = $_.DirectoryName + "\" + $_.BaseName + "_compressed.mp4"
    $originalSizeMB = [math]::Round($_.Length / 1MB, 2)
    
    Write-Host ""
    Write-Host "============================"
    Write-Host "圧縮開始: $($_.Name) ($originalSizeMB MB)"
    Write-Host "============================"
    
    # ffmpegを使用して圧縮 (画質を保ちつつ軽量化する設定 crf 28)
    ffmpeg -y -i "$inputFile" -vcodec libx264 -crf 28 -preset fast -acodec aac -b:a 128k "$outputFile"
    
    if ($?) {
        $newSizeMB = [math]::Round((Get-Item "$outputFile").Length / 1MB, 2)
        Write-Host ""
        Write-Host "✅ 圧縮完了: $originalSizeMB MB -> $newSizeMB MB"
        
        # オリジナルファイルをバックアップなしで上書き（容量節約のため）
        Move-Item -Path "$outputFile" -Destination "$inputFile" -Force
        Write-Host "ファイルを上書きしました。"
    } else {
        Write-Host "❌ 圧縮エラー: $($_.Name)" -ForegroundColor Red
    }
}
Write-Host ""
Write-Host "すべての圧縮作業が完了しました！"

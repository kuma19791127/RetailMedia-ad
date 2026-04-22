const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const targetDir = path.join(__dirname, 'base_loop_videos');
const THRESHOLD_MB = 15; // 15MB以上のファイルを圧縮対象とする

if (!fs.existsSync(targetDir)) {
    console.log(`[Error] フォルダが見つかりません: ${targetDir}`);
    process.exit(1);
}

const files = fs.readdirSync(targetDir);
const videosToCompress = [];

files.forEach(file => {
    if (file.toLowerCase().endsWith('.mp4') || file.toLowerCase().endsWith('.mov')) {
        const filePath = path.join(targetDir, file);
        const stats = fs.statSync(filePath);
        const sizeMB = stats.size / (1024 * 1024);
        
        // 圧縮済みファイル(_compressed)はスキップ
        if (!file.includes('_compressed') && sizeMB > THRESHOLD_MB) {
            videosToCompress.push({ file, filePath, sizeMB });
        }
    }
});

if (videosToCompress.length === 0) {
    console.log("🎉 圧縮が必要な大きな動画はありませんでした。");
    process.exit(0);
}

console.log(`🚀 圧縮対象の動画が ${videosToCompress.length} 件見つかりました。`);

let currentIndex = 0;

function compressNext() {
    if (currentIndex >= videosToCompress.length) {
        console.log("✅ すべての圧縮が完了しました！");
        process.exit(0);
        return;
    }

    const video = videosToCompress[currentIndex];
    console.log(`\n⏳ [${currentIndex + 1}/${videosToCompress.length}] 圧縮中: ${video.file} (${video.sizeMB.toFixed(1)} MB)`);

    const tempOutPath = path.join(targetDir, `temp_compressed_${currentIndex}.mp4`);

    ffmpeg(video.filePath)
        .outputOptions([
            '-vcodec libx264',
            '-preset fast',
            '-crf 28', // 重い圧縮 (数字が大きいほど画質は下がるが容量は軽くなる)
            '-vf scale=-2:720' // 720pにリサイズ
        ])
        .on('progress', (progress) => {
            if (progress.percent) {
                process.stdout.write(`\r   -> 進行状況: ${progress.percent.toFixed(1)}%`);
            }
        })
        .on('end', () => {
            console.log(`\n   -> 圧縮完了！元のファイルを上書きします...`);
            
            // 元のファイルを削除して上書き
            fs.unlinkSync(video.filePath);
            
            // 拡張子がmovの場合はmp4に変更して保存
            const finalName = video.file.toLowerCase().endsWith('.mov') ? video.file.replace(/\.mov$/i, '.mp4') : video.file;
            const finalPath = path.join(targetDir, finalName);
            
            fs.renameSync(tempOutPath, finalPath);
            
            const newStats = fs.statSync(finalPath);
            const newSizeMB = newStats.size / (1024 * 1024);
            console.log(`   -> 📉 削減効果: ${video.sizeMB.toFixed(1)} MB => ${newSizeMB.toFixed(1)} MB`);

            currentIndex++;
            compressNext();
        })
        .on('error', (err) => {
            console.error(`\n❌ エラー発生: ${err.message}`);
            if (fs.existsSync(tempOutPath)) fs.unlinkSync(tempOutPath);
            currentIndex++;
            compressNext();
        })
        .save(tempOutPath);
}

// 実行開始
compressNext();

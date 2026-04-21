const fs = require('fs');

let serverFileStr = fs.readFileSync('C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js', 'utf8');

const regex = /if \(src && \(src\.startsWith\('data:video\/quicktime;base64,'\) \|\| src\.startsWith\('data:video\/mp4;base64,'\)\)\) \{[\s\S]*?finishUpload\("\/uploads\/" \+ filename\);\s*\}\s*\}/;

const ffmpegLogic = `if (src && (src.startsWith('data:video/quicktime;base64,') || src.startsWith('data:video/mp4;base64,'))) {
        console.log("[Creator] Detected raw video file, attempting FFmpeg conversion to mp4...");
        const base64Data = src.split(';base64,').pop();
        const ext = src.startsWith('data:video/quicktime') ? 'mov' : 'mp4';
        const filenameIn = "creator_video_" + newId + "." + ext;
        const filenameOut = "creator_video_" + newId + ".mp4";
        const buffer = Buffer.from(base64Data, 'base64');
        
        const path = require('path');
        const savePathIn = path.join(__dirname, 'uploads', filenameIn);
        const savePathOut = path.join(__dirname, 'uploads', filenameOut);
        
        require('fs').writeFileSync(savePathIn, buffer);
        
        try {
            const ffmpeg = require('fluent-ffmpeg');
            const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
            ffmpeg.setFfmpegPath(ffmpegInstaller.path);
            
            ffmpeg(savePathIn)
                .output(savePathOut)
                .videoCodec('libx264')
                .addOption('-preset', 'fast')
                .addOption('-pix_fmt', 'yuv420p')
                .on('end', () => {
                    console.log("[Creator] Transcoding finished.");
                    try { require('fs').unlinkSync(savePathIn); } catch(e){}
                    
                    if (typeof s3Client !== 'undefined' && s3Client && typeof bucketName !== 'undefined' && bucketName) {
                        const { PutObjectCommand } = require('@aws-sdk/client-s3');
                        const fileBuf = require('fs').readFileSync(savePathOut);
                        s3Client.send(new PutObjectCommand({ 
                            Bucket: bucketName, 
                            Key: 'uploads/' + filenameOut, 
                            Body: fileBuf, 
                            ContentType: 'video/mp4' 
                        })).then(() => {
                            console.log("[Creator] S3 Upload complete: " + filenameOut);
                            try{ require('fs').unlinkSync(savePathOut); }catch(e){}
                            finishUpload("/uploads/" + filenameOut);
                        }).catch(e => {
                            console.error("[Creator] S3 failed", e);
                            try{ require('fs').unlinkSync(savePathOut); }catch(err){}
                            finishUpload(src);
                        });
                    } else {
                        finishUpload("/uploads/" + filenameOut);
                    }
                })
                .on('error', (err) => {
                    console.error("[Creator] FFmpeg error:", err.message);
                    try { require('fs').unlinkSync(savePathIn); } catch(e){}
                    // Fallback to original
                    finishUpload(src);
                })
                .run();
        } catch(e) {
            console.error("[Creator] Failed to init ffmpeg:", e.message);
            try { require('fs').unlinkSync(savePathIn); } catch(err){}
            finishUpload(src);
        }
    }`;

if (regex.test(serverFileStr)) {
    serverFileStr = serverFileStr.replace(regex, ffmpegLogic);
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js', serverFileStr, 'utf8');
    fs.writeFileSync('C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js', serverFileStr, 'utf8');
    console.log("Regex match success and patched!");
} else {
    console.log("Still could not match via regex...");
}

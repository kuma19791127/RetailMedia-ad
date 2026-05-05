const fs = require('fs');

const target = 'C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js';
let txt = fs.readFileSync(target, 'utf8');

// Trap 1: /api/campaigns transcoding writes to local and never pushes to S3!
const campTargetReg = /\.on\('end',\s*\(\)\s*=>\s*\{\s*console\.log\("\[AdUpload\] Transcoding & Compression finished\."\);\s*fs\.unlinkSync\(inputPath\);\s*\/\/\s*Clean up temp file\s*processAndInject\(`\/uploads\/ad_video_\$\{tempId\}\.mp4`\);\s*\/\/\s*We must wait to broadcast or return[\s\S]*?\}\)/m;

const campRepl = `.on('end', () => {
                    console.log("[AdUpload] Transcoding & Compression finished.");
                    if (typeof s3Client !== 'undefined' && s3Client && typeof bucketName !== 'undefined' && bucketName) {
                        try {
                            const { PutObjectCommand } = require('@aws-sdk/client-s3');
                            const fileBuf = require('fs').readFileSync(outputPath);
                            s3Client.send(new PutObjectCommand({
                                Bucket: bucketName,
                                Key: \`uploads/ad_video_\${tempId}.mp4\`,
                                Body: fileBuf,
                                ContentType: 'video/mp4'
                            })).then(() => {
                                console.log("[AdUpload] S3 Upload complete.");
                                require('fs').unlinkSync(inputPath);
                                require('fs').unlinkSync(outputPath);
                                processAndInject(\`/uploads/ad_video_\${tempId}.mp4\`);
                                if (typeof broadcastEvent === 'function') broadcastEvent({ type: 'force_reload' });
                            }).catch(err => {
                                console.error("[S3] Upload error:", err);
                                require('fs').unlinkSync(inputPath);
                                processAndInject(\`/uploads/ad_video_\${tempId}.mp4\`);
                            });
                        } catch(e) {}
                    } else {
                        require('fs').unlinkSync(inputPath);
                        processAndInject(\`/uploads/ad_video_\${tempId}.mp4\`);
                        // We must wait to broadcast or return. Because Express prefers sync response,
                        // we returned "Campaign Created" below before finish, but that's fine.
                        if (typeof broadcastEvent === 'function') broadcastEvent({ type: 'force_reload' });
                    }
                })`;

if (campTargetReg.test(txt)) {
    txt = txt.replace(campTargetReg, campRepl);
    console.log("Patched Trap 1");
} else {
    console.log("Trap 1 not matched");
}

// Trap 2: /api/ad/upload writes to LOCAL_MEDIA_PATH
const upTargetReg = /writeStream\.on\('finish',\s*\(\)\s*=>\s*\{\s*console\.log\(`\[Upload\] Saved to \$\{savePath\}`\);\s*\/\/\s*Inject into Playlist logic\s*\/\/\s*We simulate a metadata object similar to demo boost\s*const metadata = \{\s*id: `upload-\$\{Date\.now\(\)\}`,\s*title: 'Uploaded Ad',\s*url: `\/local-media\/\$\{filename\}`/m;

const upRepl = `writeStream.on('finish', () => {
        console.log(\`[Upload] Saved to \${savePath}\`);

        if (typeof s3Client !== 'undefined' && s3Client && typeof bucketName !== 'undefined' && bucketName) {
            try {
                const { PutObjectCommand } = require('@aws-sdk/client-s3');
                const fileBuf = require('fs').readFileSync(savePath);
                s3Client.send(new PutObjectCommand({
                    Bucket: bucketName,
                    Key: \`uploads/\${filename}\`,
                    Body: fileBuf
                })).then(() => {
                    console.log("[S3] Upload endpoint saved to S3");
                    require('fs').unlinkSync(savePath); 
                }).catch(e=>{});
            } catch(e){}
        }

        const metadata = {
            id: \`upload-\${Date.now()}\`,
            title: 'Uploaded Ad',
            url: \`/uploads/\${filename}\``;

if (upTargetReg.test(txt)) {
    txt = txt.replace(upTargetReg, upRepl);
    console.log("Patched Trap 2");
} else {
    console.log("Trap 2 not matched");
}

fs.writeFileSync(target, txt, 'utf8');

const fs = require('fs');

const target = 'C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js';
let txt = fs.readFileSync(target, 'utf8');

// Trap 1: /api/campaigns transcoding writes to local and never pushes to S3!
const campTarget = `.on('end', () => {
                    console.log("[AdUpload] Transcoding & Compression finished.");
                    fs.unlinkSync(inputPath); // Clean up temp file
                    processAndInject(\`/uploads/ad_video_\${tempId}.mp4\`);
                    // We must wait to broadcast or return. Because Express prefers sync response,
                    // we returned "Campaign Created" below before finish, but that's fine.
                    if (typeof broadcastEvent === 'function') broadcastEvent({ type: 'force_reload' });
                })`;
const campRepl = `.on('end', () => {
                    console.log("[AdUpload] Transcoding & Compression finished.");
                    if (typeof s3Client !== 'undefined' && s3Client && typeof bucketName !== 'undefined' && bucketName) {
                        try {
                            const { PutObjectCommand } = require('@aws-sdk/client-s3');
                            const fileBuf = fs.readFileSync(outputPath);
                            s3Client.send(new PutObjectCommand({
                                Bucket: bucketName,
                                Key: \`uploads/ad_video_\${tempId}.mp4\`,
                                Body: fileBuf,
                                ContentType: 'video/mp4'
                            })).then(() => {
                                console.log("[AdUpload] S3 Upload complete.");
                                fs.unlinkSync(inputPath);
                                fs.unlinkSync(outputPath);
                                processAndInject(\`/uploads/ad_video_\${tempId}.mp4\`);
                                if (typeof broadcastEvent === 'function') broadcastEvent({ type: 'force_reload' });
                            }).catch(err => {
                                console.error("[S3] Upload error:", err);
                                fs.unlinkSync(inputPath);
                                processAndInject(\`/uploads/ad_video_\${tempId}.mp4\`);
                            });
                        } catch(e) {}
                    } else {
                        fs.unlinkSync(inputPath);
                        processAndInject(\`/uploads/ad_video_\${tempId}.mp4\`);
                        if (typeof broadcastEvent === 'function') broadcastEvent({ type: 'force_reload' });
                    }
                })`;

// Trap 2: /api/ad/upload writes to LOCAL_MEDIA_PATH without S3 push & uses /local-media/ which has no S3 fallback proxy!
const upTarget = `    writeStream.on('finish', () => {
        console.log(\`[Upload] Saved to \${savePath}\`);

        // Inject into Playlist logic
        // We simulate a metadata object similar to demo boost
        const metadata = {
            id: \`upload-\${Date.now()}\`,
            title: 'Uploaded Ad',
            url: \`/local-media/\${filename}\`,`;

const upRepl = `    writeStream.on('finish', () => {
        console.log(\`[Upload] Saved to \${savePath}\`);

        // FIX: Upload to S3 to prevent cloud traps
        if (typeof s3Client !== 'undefined' && s3Client && typeof bucketName !== 'undefined' && bucketName) {
            try {
                const { PutObjectCommand } = require('@aws-sdk/client-s3');
                const fileBuf = fs.readFileSync(savePath);
                // Also save it to uploads folder path to unify with S3 proxy fallback!
                s3Client.send(new PutObjectCommand({
                    Bucket: bucketName,
                    Key: \`uploads/\${filename}\`,
                    Body: fileBuf
                })).then(() => {
                    console.log("[S3] Upload endpoint saved to S3");
                    fs.unlinkSync(savePath); // Clean up container ephemeral storage
                }).catch(e=>{});
            } catch(e){}
        }

        const metadata = {
            id: \`upload-\${Date.now()}\`,
            title: 'Uploaded Ad',
            url: \`/uploads/\${filename}\`,`;

if (txt.includes(campTarget)) {
    txt = txt.replace(campTarget, campRepl);
    console.log("Patched Trap 1 (Campaign Transcode S3 missed upload)");
}
if (txt.includes(upTarget)) {
    txt = txt.replace(upTarget, upRepl);
    console.log("Patched Trap 2 (Ad Dashboard Direct Upload S3 missed upload + wrong path)");
}

fs.writeFileSync(target, txt, 'utf8');

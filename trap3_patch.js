const fs = require('fs');

const target = 'C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js';
let txt = fs.readFileSync(target, 'utf8');

const tReg = /else if \(src && src\.startsWith\('data:'\)\) \{\s*\/\/\s*Save MP4 or Image to disk to prevent massive base64 broadcast\s*console\.log\("\[Creator\] Saving media file to disk\.\.\."\);\s*const ext = src\.split\(';'\)\[0\]\.split\('\/'\)\[1\] === 'mp4' \? 'mp4' : 'media';\s*const base64Data = src\.split\(';base64,'\)\.pop\(\);\s*const outputPath = path\.join\(__dirname, 'uploads', `video_\$\{newId\}\.\$\{ext\}`\);\s*fs\.writeFileSync\(outputPath, base64Data, \{ encoding: 'base64' \}\);\s*finishUpload\(`\/uploads\/video_\$\{newId\}\.\$\{ext\}`\);\s*\}/m;

const repl = `else if (src && src.startsWith('data:')) {
        console.log("[Creator] Saving generic media file to S3...");
        const mime = src.split(';')[0].split(':')[1] || 'application/octet-stream';
        const ext = mime.split('/')[1] || 'media';
        const base64Data = src.split(';base64,').pop();
        const filename = \`video_\${newId}.\${ext}\`;
        const buffer = Buffer.from(base64Data, 'base64');
        const outputPath = require('path').join(__dirname, 'uploads', filename);
        
        if (typeof s3Client !== 'undefined' && s3Client && typeof bucketName !== 'undefined' && bucketName) {
            try {
                const { PutObjectCommand } = require('@aws-sdk/client-s3');
                s3Client.send(new PutObjectCommand({ 
                    Bucket: bucketName, 
                    Key: 'uploads/' + filename, 
                    Body: buffer, 
                    ContentType: mime 
                })).then(() => {
                    console.log("[Creator] Successfully uploaded generic media to S3: " + filename);
                    finishUpload("/uploads/" + filename);
                }).catch(e => {
                    require('fs').writeFileSync(outputPath, buffer);
                    finishUpload("/uploads/" + filename);
                });
            } catch(e){
                require('fs').writeFileSync(outputPath, buffer);
                finishUpload("/uploads/" + filename);
            }
        } else {
            require('fs').writeFileSync(outputPath, buffer);
            finishUpload("/uploads/" + filename);
        }
    }`;

if (tReg.test(txt)) {
    txt = txt.replace(tReg, repl);
    fs.writeFileSync(target, txt, 'utf8');
    console.log("Patched Trap 3");
} else {
    console.log("Trap 3 not matched");
}

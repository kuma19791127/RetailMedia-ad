const fs = require('fs');
const pathStr = 'C:/Users/one/Desktop/RetailMedia_System/server_retail_dist.js';
let t = fs.readFileSync(pathStr, 'utf8');

const oldStart = "if (src && src.startsWith('data:video/quicktime;base64,')) {";
const tempEndStr = "finishUpload(src); // Fallback to original just in cas";
const endPart1 = t.indexOf(tempEndStr);
// Need to find the end of this block
const oldEnd = t.indexOf("    }", endPart1) + 5;

if (t.indexOf(oldStart) > -1 && endPart1 > -1) {
    const startIdx = t.indexOf(oldStart);
    const endIdx = t.indexOf("    } else {", startIdx);
    
    // Actually the block is:
    /*
    if (src && src.startsWith('data:video/quicktime;base64,')) {
        // ... ffmpeg
    } else {
        finishUpload(src);
    }
    */
    
    const blockEnd = t.indexOf("    }", t.indexOf("finishUpload(src);", endIdx)) + 5;

    const newBlock = `if (src && (src.startsWith('data:video/quicktime;base64,') || src.startsWith('data:video/mp4;base64,'))) {
        console.log("[Creator] Detected raw video file, uploading directly to S3...");
        const base64Data = src.split(';base64,').pop();
        const ext = src.startsWith('data:video/quicktime') ? 'mov' : 'mp4';
        const filename = "creator_video_" + newId + "." + ext;
        const buffer = Buffer.from(base64Data, 'base64');
        
        if (typeof s3Client !== 'undefined' && s3Client && typeof bucketName !== 'undefined' && bucketName) {
            const { PutObjectCommand } = require('@aws-sdk/client-s3');
            s3Client.send(new PutObjectCommand({ 
                Bucket: bucketName, 
                Key: 'uploads/' + filename, 
                Body: buffer, 
                ContentType: 'video/' + ext 
            })).then(() => {
                console.log("[Creator] Successfully uploaded to S3: " + filename);
                finishUpload("/uploads/" + filename);
            }).catch(e => {
                console.error("[Creator] S3 Upload Failed", e);
                finishUpload(src);
            });
        } else {
            const savePath = require('path').join(__dirname, 'uploads', filename);
            fs.writeFileSync(savePath, buffer);
            finishUpload("/uploads/" + filename);
        }
    } else {
        finishUpload(src);
    }`;

    t = t.substring(0, startIdx) + newBlock + t.substring(blockEnd);
    fs.writeFileSync(pathStr, t);
    console.log("Patched /api/creator/upload");
} else {
    console.log("Could not find boundaries");
}

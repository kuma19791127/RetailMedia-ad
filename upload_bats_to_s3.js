require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

const s3Client = new S3Client({ region: process.env.AWS_DEFAULT_REGION || "us-east-1" });
const bucketName = "retail-media-db-2026";

async function uploadFile(filename) {
    if (!fs.existsSync(filename)) {
        console.error(`File not found: ${filename}`);
        return;
    }
    const content = fs.readFileSync(filename);
    try {
        await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: filename,
            Body: content,
            ContentType: 'application/x-bat'
        }));
        console.log(`[OK] Successfully uploaded ${filename} to S3.`);
    } catch (e) {
        console.error(`[Error] Failed to upload ${filename}: ${e.message}`);
    }
}

async function main() {
    await uploadFile('setup_retail_signage.bat');
    await uploadFile('remove_retail_signage.bat');
}

main();

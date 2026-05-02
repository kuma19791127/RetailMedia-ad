const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3 = new S3Client({
    region: process.env.AWS_DEFAULT_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

async function upload() {
    try {
        const fileContent = fs.readFileSync('admin_portal.html');
        const bucket = process.env.AWS_S3_BUCKET_NAME || 'retail-media-db-2026';
        const key = 'uploads/admin_portal.html';

        console.log(`Uploading to bucket: ${bucket}, key: ${key}`);

        await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: fileContent,
            ContentType: 'text/html'
        }));
        
        console.log(`Successfully uploaded. URL: https://${bucket}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${key}`);
    } catch (err) {
        console.error("Error uploading to S3:", err);
    }
}

upload();

const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
try { require('dotenv').config(); } catch (e) {}

const s3 = new S3Client({
    region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

async function upload() {
    try {
        const fileContent = fs.readFileSync('database.json');
        const bucket = process.env.AWS_S3_BUCKET_NAME || 'retail-media-db-2026';
        const key = 'database.json';

        console.log(`Uploading to bucket: ${bucket}, key: ${key}`);

        await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: fileContent,
            ContentType: 'application/json'
        }));
        
        console.log('Successfully uploaded database.json to S3.');
    } catch (err) {
        console.error("Error uploading to S3:", err);
    }
}

upload();

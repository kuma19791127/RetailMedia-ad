const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

// AWS SDK credentials fallback chain
const s3Config = {
    region: process.env.AWS_DEFAULT_REGION || 'us-east-1'
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    s3Config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };
}

const s3 = new S3Client(s3Config);

async function uploadApk() {
    try {
        const apkPath = 'C:\\Users\\one\\AndroidStudioProjects\\RetailMediaSignage\\app\\build\\outputs\\apk\\debug\\app-debug.apk';
        
        if (!fs.existsSync(apkPath)) {
            throw new Error(`APK file not found at path: ${apkPath}`);
        }

        const fileContent = fs.readFileSync(apkPath);
        const bucket = process.env.AWS_S3_BUCKET_NAME || 'retail-media-db-2026';
        const key = 'app-debug.apk';

        console.log(`Uploading APK to bucket: ${bucket}, key: ${key}`);

        await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: fileContent,
            ContentType: 'application/vnd.android.package-archive'
        }));
        
        console.log(`Successfully uploaded. URL: https://${bucket}.s3.${s3Config.region}.amazonaws.com/${key}`);
    } catch (err) {
        console.error("Error uploading APK to S3:", err);
    }
}

uploadApk();

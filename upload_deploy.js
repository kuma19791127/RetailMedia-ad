const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

async function uploadToS3() {
    const s3 = new S3Client({ region: 'us-east-1' });
    const bucketName = 'retail-media-db-2026';
    const key = 'deploy/backend_deploy.zip';
    
    console.log(`Uploading backend_deploy.zip to s3://${bucketName}/${key} ...`);
    
    try {
        const fileStream = fs.readFileSync('backend_deploy.zip');
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: fileStream,
            ContentType: 'application/zip'
        });
        
        await s3.send(command);
        console.log('Successfully uploaded deployment package to S3!');
    } catch (err) {
        console.error('Error uploading to S3:', err);
    }
}

uploadToS3();

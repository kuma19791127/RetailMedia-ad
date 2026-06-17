const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
};

const jsonPath = path.resolve(__dirname, '..', 'database.json');
if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (data.users && data.users['buzzkun0807@gmail.com']) {
        const newHash = hashPassword('9838love');
        data.users['buzzkun0807@gmail.com'].password = newHash;
        data.users['buzzkun0807@gmail.com'].twoFactorSecret = null;
        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
        console.log('Successfully updated buzzkun0807@gmail.com password in database.json and cleared 2FA.');
    }
}

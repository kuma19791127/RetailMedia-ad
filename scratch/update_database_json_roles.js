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
    if (data.users) {
        // 1. Retailer (store role) - buzzkun0807@gmail.com
        data.users['buzzkun0807@gmail.com'] = {
            password: hashPassword('hoddij-damce0-xuwtAx'),
            role: 'store',
            name: '熊澤',
            org: 'Demo Corp',
            twoFactorSecret: null
        };
        
        // 2. Admin (admin role) - buzzkun0807@gmail.com:admin
        data.users['buzzkun0807@gmail.com:admin'] = {
            password: hashPassword('9838loVE'),
            role: 'admin',
            name: '熊澤 (管理者)',
            org: 'Demo Corp',
            twoFactorSecret: null
        };

        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
        console.log('Successfully updated database.json with store and admin roles for buzzkun0807@gmail.com.');
    }
}

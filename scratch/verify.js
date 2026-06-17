const crypto = require('crypto');

const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
    if (!storedHash.includes(':')) return password === storedHash;
    const [salt, hash] = storedHash.split(':');
    const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return hash === verifyHash;
};

const storedHash = "740832accfa1f79a64d6637b8834bd75:89359e2710884ecf488289dd8966425b2c14b4f91ccbbf8639aa009a1e27afd3498530da41b57b091cad898301a8b3276b5fd12cd8e0aed35d469a063669136e";
const testPassword = "9838love";

console.log('Verifying standard password:', verifyPassword(testPassword, storedHash));

// Also check if there's any case or whitespace issue
const testPasswordTrimmed = testPassword.trim();
console.log('Verifying trimmed:', verifyPassword(testPasswordTrimmed, storedHash));

// Let's generate a new hash from hoddij-damce0-xuwtAx just to see
const newHash = hashPassword(testPassword);
console.log('New hash verification:', verifyPassword(testPassword, newHash));

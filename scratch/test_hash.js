const crypto = require('crypto');

const verifyPassword = (password, storedHash) => {
    if (!storedHash.includes(':')) return password === storedHash;
    const [salt, hash] = storedHash.split(':');
    const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return hash === verifyHash;
};

const hash = "e17ba7fd151cc30a97e21f8120fe5b48:aeac2f5f11990ef724aabb53513c3e021f23fb36b629d32059caa8e516eadabec94b4886b1948cfbc6173e5bb75e11b16ea2597f016279c2f2eab7dcb7a526cc";

console.log("hoddij-damce0-xuwtAx:", verifyPassword("hoddij-damce0-xuwtAx", hash));
console.log("9838loVE:", verifyPassword("9838loVE", hash));

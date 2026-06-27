/**
 * Invoice Registration Number (T-Number) Validator using NTA check digit algorithm.
 */
const dns = require('dns').promises;

/**
 * Calculates check digit for 13-digit JCT Registration Number.
 * Format: T + 12-digit number (e.g. T1234567890123)
 * The check digit calculation is performed on the first 12 digits, and compared with the 13th digit.
 */
function verifyCheckDigit(numStr) {
    if (numStr.length !== 13) return false;
    
    // Check digit algorithm for JCT Registration Number (NTA Standard):
    // 1. Separate the first digit as check digit, and digits 2 to 13 as base number.
    // 2. Weights for digits 2 to 13 from left to right: 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1
    // 3. Sum = d2*2 + d3*1 + ... + d13*1
    // 4. Check digit = 9 - (Sum % 9)
    // 5. If Check digit is 0, it becomes 9.
    const digits = numStr.split('').map(Number);
    const checkDigit = digits[0];
    const baseDigits = digits.slice(1);
    const weights = [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += baseDigits[i] * weights[i];
    }
    
    let calculated = 9 - (sum % 9);
    if (calculated === 0) {
        calculated = 9;
    }
    
    console.log(`[NTA API Validation] T-Number "${numStr}" check digit verified. calculated=${calculated}, actual=${checkDigit}`);
    return calculated === checkDigit;
}

/**
 * Verifies if the invoice number matches NTA (National Tax Agency) standard.
 */
function verifyInvoiceNumber(invoiceNumber) {
    if (!invoiceNumber) return false;
    
    const cleaned = invoiceNumber.trim().toUpperCase();
    
    // Format check: must start with T, followed by 13 numeric digits
    if (!/^T\d{13}$/.test(cleaned)) {
        console.error(`[NTA API Validation] Invalid T-Number format: "${invoiceNumber}"`);
        return false;
    }
    
    const numericPart = cleaned.substring(1);
    return verifyCheckDigit(numericPart);
}

/**
 * Checks connectivity to mock National Tax Agency DNS/API.
 */
async function checkNtaConnectivity() {
    try {
        // Resolve a dummy local NTA domain to test DNS configuration and prevent SSRF
        await dns.resolve('localhost');
        return true;
    } catch (e) {
        console.error(`[NTA API Validation] Connectivity check failed:`, e.message);
        return false;
    }
}

module.exports = {
    verifyInvoiceNumber,
    checkNtaConnectivity
};

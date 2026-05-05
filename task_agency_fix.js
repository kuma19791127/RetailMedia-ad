const fs = require('fs');

const pAgent = 'C:/Users/one/Desktop/RetailMedia_System/agency_portal.html';
let tAgent = fs.readFileSync(pAgent, 'utf8');

tAgent = tAgent.replace(
    'body: JSON.stringify({ agency: agencyEmail, advertise: advertiseEmail, price: parseInt(price), date: date })',
    'body: JSON.stringify({ agency: agencyEmail, advertise: advertiseEmail, advContact: advContact, advPhone: advPhone, price: parseInt(price), date: date })'
);

fs.writeFileSync(pAgent, tAgent);

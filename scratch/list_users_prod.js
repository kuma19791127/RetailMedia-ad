async function listUsers() {
    const baseUrl = 'https://nsg3hyme2k.us-east-1.awsapprunner.com';
    try {
        const res = await fetch(`${baseUrl}/api/auth/users`);
        const data = await res.json();
        console.log('Production Users:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error fetching users:', e);
    }
}
listUsers();

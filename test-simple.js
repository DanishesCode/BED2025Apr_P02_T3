const http = require('http');

function testSignup() {
    const postData = JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        dob: '1990-01-01'
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/auth/signup',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res.headers)}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Raw response:', data);
            console.log('Response length:', data.length);
            
            if (data.length > 0) {
                try {
                    const jsonData = JSON.parse(data);
                    console.log('Parsed JSON:', jsonData);
                } catch (e) {
                    console.error('JSON parse error:', e.message);
                    console.log('First 100 characters:', data.substring(0, 100));
                }
            } else {
                console.log('Empty response received');
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Request error: ${e.message}`);
    });

    req.write(postData);
    req.end();
}

testSignup(); 
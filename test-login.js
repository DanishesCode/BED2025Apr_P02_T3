const fetch = require('node-fetch');

async function testLogin() {
    console.log('Testing login functionality...\n');

    // Test 1: Signup a new user
    console.log('1. Testing user signup...');
    try {
        const signupResponse = await fetch('http://localhost:3000/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                dob: '1990-01-01'
            })
        });

        const signupResult = await signupResponse.json();
        console.log('Signup response:', signupResult);

        if (signupResult.success) {
            console.log('✅ Signup successful!');
        } else {
            console.log('❌ Signup failed:', signupResult.message);
        }
    } catch (error) {
        console.error('❌ Signup error:', error.message);
    }

    // Test 2: Login with the created user
    console.log('\n2. Testing user login...');
    try {
        const loginResponse = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });

        const loginResult = await loginResponse.json();
        console.log('Login response:', loginResult);

        if (loginResult.success) {
            console.log('✅ Login successful!');
            console.log('Token received:', loginResult.token ? 'Yes' : 'No');
            console.log('User info received:', loginResult.user ? 'Yes' : 'No');
        } else {
            console.log('❌ Login failed:', loginResult.message);
        }
    } catch (error) {
        console.error('❌ Login error:', error.message);
    }

    // Test 3: Test invalid login
    console.log('\n3. Testing invalid login...');
    try {
        const invalidLoginResponse = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'wrongpassword'
            })
        });

        const invalidLoginResult = await invalidLoginResponse.json();
        console.log('Invalid login response:', invalidLoginResult);

        if (!invalidLoginResult.success) {
            console.log('✅ Invalid login correctly rejected!');
        } else {
            console.log('❌ Invalid login should have been rejected!');
        }
    } catch (error) {
        console.error('❌ Invalid login test error:', error.message);
    }

    console.log('\n✅ Login functionality test completed!');
}

testLogin(); 
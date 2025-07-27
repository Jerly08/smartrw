const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testLogin() {
  try {
    console.log('Testing login endpoint...\n');

    // Test cases
    const testCases = [
      {
        name: 'Test User',
        email: 'test@smartrw.com',
        password: 'password123'
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123' // Assuming same password
      },
      {
        name: 'RT User',
        email: 'rt@example.com',
        password: 'password123'
      },
      {
        name: 'RW User',
        email: 'rw@example.com',
        password: 'password123'
      },
      {
        name: 'Warga User',
        email: 'warga@example.com',
        password: 'password123'
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n=== Testing ${testCase.name} ===`);
      console.log(`Email: ${testCase.email}`);
      
      try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
          email: testCase.email,
          password: testCase.password
        });

        console.log('✅ Login successful!');
        console.log('Response:', {
          status: response.data.status,
          message: response.data.message,
          user: response.data.data.user,
          tokenLength: response.data.data.token.length
        });

      } catch (error) {
        if (error.response) {
          console.log('❌ Login failed!');
          console.log('Status:', error.response.status);
          console.log('Error:', error.response.data);
        } else {
          console.log('❌ Network error:', error.message);
        }
      }
    }

    // Test invalid credentials
    console.log('\n=== Testing Invalid Credentials ===');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test@smartrw.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      console.log('✅ Invalid credentials properly rejected!');
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data.message);
    }

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

// Check if server is running first
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/auth/profile`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running! Please start the server first with: npm run dev');
      return false;
    }
    return true; // Server is running but endpoint returned error (expected)
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testLogin();
  }
}

main();

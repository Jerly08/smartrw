const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testFrontendBackendConnection() {
  console.log('=== TESTING FRONTEND-BACKEND CONNECTION ===\n');

  // Test users from database
  const testUsers = [
    {
      name: 'Test User',
      email: 'test@smartrw.com',
      password: 'password123'
    },
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123'
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

  for (const user of testUsers) {
    console.log(`\n--- Testing Login: ${user.name} ---`);
    console.log(`Email: ${user.email}`);
    
    try {
      // Test login API call (simulating frontend)
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: user.email,
        password: user.password
      });

      if (loginResponse.data.status === 'success') {
        console.log('✅ Login API: SUCCESS');
        console.log(`   User ID: ${loginResponse.data.data.user.id}`);
        console.log(`   User Name: ${loginResponse.data.data.user.name}`);
        console.log(`   User Role: ${loginResponse.data.data.user.role}`);
        console.log(`   Token: ${loginResponse.data.data.token.substring(0, 20)}...`);

        // Test profile API call with token
        try {
          const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${loginResponse.data.data.token}`
            }
          });

          if (profileResponse.data.status === 'success') {
            console.log('✅ Profile API: SUCCESS');
            console.log(`   Profile Name: ${profileResponse.data.data.user.name}`);
            console.log(`   Profile Email: ${profileResponse.data.data.user.email}`);
            if (profileResponse.data.data.user.resident) {
              console.log(`   Resident Info: ${profileResponse.data.data.user.resident.fullName}`);
            }
          }
        } catch (profileError) {
          console.log('❌ Profile API: FAILED');
          console.log(`   Error: ${profileError.response?.data?.message || profileError.message}`);
        }

      } else {
        console.log('❌ Login API: FAILED');
        console.log(`   Response: ${JSON.stringify(loginResponse.data)}`);
      }

    } catch (loginError) {
      console.log('❌ Login API: FAILED');
      if (loginError.response) {
        console.log(`   Status: ${loginError.response.status}`);
        console.log(`   Error: ${loginError.response.data.message || 'Unknown error'}`);
      } else {
        console.log(`   Network Error: ${loginError.message}`);
      }
    }
  }

  // Test invalid credentials
  console.log('\n--- Testing Invalid Credentials ---');
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    });
    console.log('❌ Should have failed for invalid credentials');
  } catch (error) {
    console.log('✅ Invalid credentials properly rejected');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message}`);
  }

  console.log('\n=== TEST COMPLETED ===');
}

// Check if backend server is running
async function checkBackendServer() {
  try {
    const response = await axios.get(`${BASE_URL}/auth/profile`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running!');
      console.log('Please start the backend server first:');
      console.log('cd backend && npm run dev');
      return false;
    }
    return true; // Server is running but returned an error (expected for unauthorized request)
  }
}

async function main() {
  console.log('Checking backend server...');
  const serverRunning = await checkBackendServer();
  
  if (serverRunning) {
    await testFrontendBackendConnection();
  }
}

main().catch(console.error);

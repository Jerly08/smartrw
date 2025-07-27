const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testRTCreation() {
  try {
    console.log('Testing RT Creation endpoint...\n');

    // First, login to get authentication token
    console.log('=== Step 1: Login as RW user ===');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'rw@smartrw.com',
      password: 'rw123456'
    });

    if (loginResponse.data.status !== 'success') {
      console.log('❌ Login failed!');
      console.log('Response:', loginResponse.data);
      return;
    }

    console.log('✅ Login successful!');
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    console.log('User:', user.name, '-', user.role);
    console.log('Token length:', token.length);

    // Setup axios instance with auth header
    const authenticatedAxios = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Test RT creation with valid data
    console.log('\n=== Step 2: Create RT with valid data ===');
    
    const rtData = {
      number: "001", // 3-digit string as required
      name: "RT Satu", // min 3 chars
      description: "RT pertama di RW ini", // max 500 chars
      address: "Jalan Merdeka No. 1, RT 001", // min 10 chars
      chairperson: "Budi Santoso", // min 3 chars
      phoneNumber: "081234567890", // Indonesian phone format
      email: "rt001@smartrw.local", // valid email
      isActive: true
    };

    console.log('RT Data to be sent:', rtData);

    try {
      const rtResponse = await authenticatedAxios.post('/rt', rtData);
      
      console.log('✅ RT Creation successful!');
      console.log('Response status:', rtResponse.data.status);
      console.log('Response message:', rtResponse.data.message);
      console.log('Created RT:', rtResponse.data.data.rt);
      console.log('Generated credentials:', rtResponse.data.data.credentials);

    } catch (error) {
      console.log('❌ RT Creation failed!');
      console.log('Status:', error.response?.status);
      console.log('Error response:', error.response?.data);
      
      if (error.response?.data?.errors) {
        console.log('\nDetailed validation errors:');
        error.response.data.errors.forEach((err, index) => {
          console.log(`${index + 1}. ${err.field}: ${err.message}`);
        });
      }
    }

    // Test RT creation with invalid data (duplicate number)
    console.log('\n=== Step 3: Test duplicate RT number ===');
    try {
      const duplicateRtResponse = await authenticatedAxios.post('/rt', rtData);
      console.log('⚠️ Duplicate RT creation should have failed but succeeded:', duplicateRtResponse.data);
    } catch (error) {
      console.log('✅ Duplicate RT properly rejected!');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data?.message);
    }

    // Test RT creation with invalid data (wrong number format)
    console.log('\n=== Step 4: Test invalid RT number format ===');
    const invalidRtData = {
      ...rtData,
      number: "12", // Only 2 digits, should be 3
      email: "rt002@smartrw.local" // Different email to avoid duplicate
    };

    try {
      const invalidRtResponse = await authenticatedAxios.post('/rt', invalidRtData);
      console.log('⚠️ Invalid RT number should have failed but succeeded:', invalidRtResponse.data);
    } catch (error) {
      console.log('✅ Invalid RT number properly rejected!');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data?.message);
      
      if (error.response?.data?.errors) {
        console.log('\nValidation errors:');
        error.response.data.errors.forEach((err, index) => {
          console.log(`${index + 1}. ${err.field}: ${err.message}`);
        });
      }
    }

    // Test RT creation with missing required field
    console.log('\n=== Step 5: Test missing required field ===');
    const missingFieldData = {
      name: "RT Tiga",
      description: "RT ketiga",
      // Missing 'number' field
    };

    try {
      const missingFieldResponse = await authenticatedAxios.post('/rt', missingFieldData);
      console.log('⚠️ Missing required field should have failed but succeeded:', missingFieldResponse.data);
    } catch (error) {
      console.log('✅ Missing required field properly rejected!');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data?.message);
      
      if (error.response?.data?.errors) {
        console.log('\nValidation errors:');
        error.response.data.errors.forEach((err, index) => {
          console.log(`${index + 1}. ${err.field}: ${err.message}`);
        });
      }
    }

    // Test unauthorized access (no token)
    console.log('\n=== Step 6: Test unauthorized access ===');
    try {
      const unauthorizedResponse = await axios.post(`${BASE_URL}/rt`, rtData);
      console.log('⚠️ Unauthorized access should have failed but succeeded:', unauthorizedResponse.data);
    } catch (error) {
      console.log('✅ Unauthorized access properly rejected!');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data?.message);
    }

  } catch (error) {
    console.error('Test setup error:', error.message);
  }
}

// Check if server is running first
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/auth/profile`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running! Please start the server with: npm run dev');
      return false;
    }
    return true; // Server is running but endpoint returned error (expected)
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testRTCreation();
  }
}

main();

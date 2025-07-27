const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testRTCreation() {
  try {
    console.log('🔐 Step 1: Logging in as RW user...');
    
    // Step 1: Login to get JWT token
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'rw@smartrw.com',
      password: 'rw123456'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful! Token received.');
    console.log('Token preview:', token.substring(0, 50) + '...');
    
    // Step 2: Create RT with authentication
    console.log('\n🎯 Step 2: Creating new RT...');
    
    const rtData = {
      number: '003',
      name: 'RT 003 Maju Bersama',
      description: 'RT 003 untuk wilayah Jalan Kemerdekaan dan sekitarnya',
      address: 'Jl. Kemerdekaan No. 1-50, RW 002',
      chairperson: 'Bapak Sutrisno',
      phoneNumber: '081234567899',
      email: 'rt003@smartrw.com'
    };
    
    const createResponse = await axios.post(`${BASE_URL}/api/rt`, rtData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ RT created successfully!');
    console.log('Response:', JSON.stringify(createResponse.data, null, 2));
    
    if (createResponse.data.credentials) {
      console.log('\n🔑 RT Login Credentials:');
      console.log(`Email: ${createResponse.data.credentials.email}`);
      console.log(`Password: ${createResponse.data.credentials.password}`);
    }
    
  } catch (error) {
    console.error('❌ Error occurred:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testRTCreation();

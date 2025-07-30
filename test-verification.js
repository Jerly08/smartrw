const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

// Test data
const testUser = {
  email: `warga.test.${Date.now()}@example.com`,
  password: 'password123',
  name: 'Warga Test'
};

const verificationData = {
  name: 'Budi Santoso',
  birthDate: '1990-05-15',
  address: 'Jl. Merdeka No. 123, Jakarta Pusat',
  rtId: 1 // Pastikan ada RT dengan id 1 di database
};

async function testVerificationFlow() {
  try {
    console.log('🚀 Starting verification flow test...\n');

    // 1. Register new user
    console.log('1. Registering new user...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log('✅ User registered successfully');
    console.log('User ID:', registerResponse.data.data.user.id);
    
    const token = registerResponse.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // 2. Get available RTs
    console.log('\n2. Getting available RTs...');
    const rtsResponse = await axios.get(`${BASE_URL}/auth/rts`, { headers });
    console.log('✅ Available RTs fetched');
    console.log('Number of RTs:', rtsResponse.data.data.rts.length);
    
    if (rtsResponse.data.data.rts.length > 0) {
      const firstRT = rtsResponse.data.data.rts[0];
      console.log('First RT:', {
        id: firstRT.id,
        number: firstRT.number,
        name: firstRT.name,
        residents: firstRT._count?.residents || 0
      });
      
      // Update rtId to use actual RT from database
      verificationData.rtId = firstRT.id;
    } else {
      console.log('⚠️ No RTs available. Creating test RT first...');
      // You might need to create an RT first if none exists
      return;
    }

    // 3. Verify resident
    console.log('\n3. Verifying resident data...');
    const verifyResponse = await axios.post(`${BASE_URL}/auth/verify-resident`, verificationData, { headers });
    console.log('✅ Resident verified successfully');
    console.log('Resident data:', {
      id: verifyResponse.data.data.resident.id,
      fullName: verifyResponse.data.data.resident.fullName,
      rtNumber: verifyResponse.data.data.resident.rtNumber,
      isVerified: verifyResponse.data.data.resident.isVerified
    });
    console.log('RT data:', {
      id: verifyResponse.data.data.rt.id,
      number: verifyResponse.data.data.rt.number,
      name: verifyResponse.data.data.rt.name
    });

    // 4. Check profile after verification
    console.log('\n4. Checking profile after verification...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, { headers });
    console.log('✅ Profile fetched');
    console.log('User has resident data:', !!profileResponse.data.data.user.resident);
    if (profileResponse.data.data.user.resident) {
      console.log('Resident verified:', profileResponse.data.data.user.resident.isVerified);
    }

    console.log('\n🎉 Verification flow test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.errors) {
      console.error('Validation errors:', error.response.data.errors);
    }
  }
}

// Test case for already verified user
async function testAlreadyVerifiedUser() {
  try {
    console.log('\n🔄 Testing already verified user scenario...');
    
    // Try to verify again with same token (this should fail)
    const token = 'your_existing_token_here'; // Replace with actual token
    const headers = { Authorization: `Bearer ${token}` };
    
    const verifyResponse = await axios.post(`${BASE_URL}/auth/verify-resident`, verificationData, { headers });
    console.log('❌ This should not succeed');
    
  } catch (error) {
    console.log('✅ Correctly rejected already verified user');
    console.log('Error message:', error.response?.data?.message);
  }
}

// Run tests
if (require.main === module) {
  testVerificationFlow();
  
  // Uncomment to test already verified scenario
  // setTimeout(() => testAlreadyVerifiedUser(), 5000);
}

module.exports = {
  testVerificationFlow,
  testAlreadyVerifiedUser
};

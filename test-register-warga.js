const fetch = require('node-fetch');

const BACKEND_URL = 'http://localhost:3001';

const testWargaData = {
  email: "test.warga@example.com",
  password: "password123",
  nik: "1234567890123456",
  noKK: "9876543210987654",
  fullName: "Test Warga",
  gender: "LAKI_LAKI",
  birthPlace: "Jakarta",
  birthDate: "1990-01-01",
  address: "Jl. Test No. 123, Jakarta",
  rtNumber: "001",
  rwNumber: "001",
  religion: "ISLAM",
  maritalStatus: "BELUM_KAWIN",
  occupation: "Software Developer",
  education: "S1",
  phoneNumber: "08123456789",
  domicileStatus: "TETAP",
  vaccinationStatus: "DOSIS_2",
  familyRole: "KEPALA_KELUARGA"
};

async function testRegisterWarga() {
  try {
    console.log('Testing register warga endpoint...');
    console.log('URL:', `${BACKEND_URL}/api/auth/register/warga`);
    console.log('Data:', JSON.stringify(testWargaData, null, 2));

    const response = await fetch(`${BACKEND_URL}/api/auth/register/warga`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testWargaData),
    });

    const result = await response.json();

    console.log('\n--- Response ---');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ SUCCESS: Register warga endpoint working!');
      console.log('User ID:', result.data?.user?.id);
      console.log('Resident ID:', result.data?.resident?.id);
      console.log('Token generated:', !!result.data?.token);
    } else {
      console.log('\n❌ FAILED: Register warga endpoint error');
      if (result.errors) {
        console.log('Validation errors:');
        result.errors.forEach(error => {
          console.log(`- ${error.path}: ${error.message}`);
        });
      }
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.log('Make sure backend server is running on port 3001');
  }
}

// Test validation errors
async function testValidationErrors() {
  try {
    console.log('\n\n=== Testing Validation Errors ===');
    
    const invalidData = {
      email: "invalid-email",
      password: "123", // too short
      nik: "123", // too short
      // missing required fields
    };

    const response = await fetch(`${BACKEND_URL}/api/auth/register/warga`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData),
    });

    const result = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.status === 400) {
      console.log('\n✅ SUCCESS: Validation working correctly!');
    } else {
      console.log('\n❌ UNEXPECTED: Expected 400 status for invalid data');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

// Test duplicate email
async function testDuplicateEmail() {
  try {
    console.log('\n\n=== Testing Duplicate Email ===');
    
    // First registration (should succeed)
    const firstData = { ...testWargaData, email: "duplicate.test@example.com", nik: "1111111111111111" };
    
    const firstResponse = await fetch(`${BACKEND_URL}/api/auth/register/warga`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(firstData),
    });

    console.log('First registration status:', firstResponse.status);
    
    if (firstResponse.ok) {
      // Second registration with same email (should fail)
      const secondData = { ...testWargaData, email: "duplicate.test@example.com", nik: "2222222222222222" };
      
      const secondResponse = await fetch(`${BACKEND_URL}/api/auth/register/warga`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(secondData),
      });

      const secondResult = await secondResponse.json();
      console.log('Second registration status:', secondResponse.status);
      console.log('Second registration response:', JSON.stringify(secondResult, null, 2));

      if (secondResponse.status === 400 && secondResult.message?.includes('Email already in use')) {
        console.log('\n✅ SUCCESS: Duplicate email detection working!');
      } else {
        console.log('\n❌ FAILED: Duplicate email should be rejected');
      }
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Register Warga Tests\n');
  console.log('='.repeat(50));
  
  await testRegisterWarga();
  await testValidationErrors();
  await testDuplicateEmail();
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testRegisterWarga,
  testValidationErrors,
  testDuplicateEmail,
  runAllTests
};

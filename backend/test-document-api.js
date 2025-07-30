const fetch = require('node-fetch');

async function testDocumentAPI() {
  try {
    console.log('Testing document API endpoint...');
    
    // Test getting documents for resident ID 37
    const response = await fetch('http://localhost:4000/api/residents/37/documents', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // In real scenario, you would need a valid JWT token here
        // 'Authorization': 'Bearer your-jwt-token-here'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Documents API Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('API Response Status:', response.status);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testDocumentAPI();

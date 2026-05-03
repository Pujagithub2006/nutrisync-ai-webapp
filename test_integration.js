// Test the complete integration
const http = require('http');

async function testIntegration() {
  console.log('🔍 Testing complete integration...');
  
  // Test 1: Node.js proxy health
  try {
    const response = await fetch('http://localhost:5000/api/vitals-realtime');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Node.js proxy working:', data);
    } else {
      console.log('❌ Node.js proxy failed:', response.status);
    }
  } catch (err) {
    console.log('❌ Node.js proxy error:', err.message);
  }
}

testIntegration();

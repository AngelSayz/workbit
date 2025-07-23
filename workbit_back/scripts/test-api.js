#!/usr/bin/env node

const axios = require('axios').default;

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

console.log('🧪 WorkBit API Testing Script');
console.log(`📡 Testing API at: ${API_BASE_URL}\n`);

async function testEndpoint(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
    return response.data;
  } catch (error) {
    const status = error.response?.status || 'Network Error';
    const message = error.response?.data?.error || error.message;
    console.log(`❌ ${method} ${endpoint} - Status: ${status} - ${message}`);
    return null;
  }
}

async function runTests() {
  console.log('1. Testing Health Endpoints...');
  await testEndpoint('GET', '/health');
  await testEndpoint('GET', '/api/health');
  
  console.log('\n2. Testing Root Endpoint...');
  await testEndpoint('GET', '/');
  
  console.log('\n3. Testing Authentication (expect 400/401)...');
  await testEndpoint('POST', '/login', { username: 'test', password: 'test' });
  
  console.log('\n4. Testing Protected Routes (expect 401)...');
  await testEndpoint('GET', '/api/users');
  await testEndpoint('GET', '/api/spaces');
  await testEndpoint('GET', '/api/reservations');
  
  console.log('\n🎯 API Testing Complete!');
  console.log('Note: Authentication errors are expected without valid credentials.');
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests }; 
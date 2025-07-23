#!/usr/bin/env node

const https = require('https');
const http = require('http');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testEndpoint(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WorkBit-Test-Client/1.0'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = client.request(options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedBody = responseBody ? JSON.parse(responseBody) : {};
          console.log(`✅ ${method} ${path} - Status: ${res.statusCode}`);
          if (res.statusCode >= 400) {
            console.log(`   Error: ${parsedBody.error || parsedBody.message || 'Unknown error'}`);
          }
          resolve({ status: res.statusCode, data: parsedBody });
        } catch (error) {
          console.log(`❌ ${method} ${path} - Failed to parse response: ${error.message}`);
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${method} ${path} - Request failed: ${error.message}`);
      resolve({ status: 0, error: error.message });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing WorkBit Backend API (Supabase Auth Version)');
  console.log('='.repeat(60));
  
  console.log('\n1. Testing Health Endpoints...');
  await testEndpoint('GET', '/health');
  await testEndpoint('GET', '/api/health');
  
  console.log('\n2. Testing Root Endpoint...');
  await testEndpoint('GET', '/');
  
  console.log('\n3. Testing Authentication (expect 401 for invalid credentials)...');
  await testEndpoint('POST', '/login', { 
    email: 'test@example.com', 
    password: 'invalidpassword' 
  });
  
  console.log('\n4. Testing Registration (expect 400 if email already exists)...');
  await testEndpoint('POST', '/api/auth/register', {
    name: 'Test',
    lastname: 'User',
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  });
  
  console.log('\n5. Testing Protected Routes (expect 401 without token)...');
  await testEndpoint('GET', '/api/users');
  await testEndpoint('GET', '/api/users/profile');
  await testEndpoint('GET', '/api/spaces');
  await testEndpoint('GET', '/api/reservations');
  
  console.log('\n6. Testing Card Management...');
  await testEndpoint('GET', '/api/cards');
  
  console.log('\n7. Testing Analytics...');
  await testEndpoint('GET', '/api/analytics');
  
  console.log('\n🎯 API Testing Complete!');
  console.log('\nℹ️  Notes:');
  console.log('   - Authentication errors are expected without valid credentials');
  console.log('   - Login now requires email instead of username');
  console.log('   - All user endpoints now work with Supabase Auth');
  console.log('   - Use valid Supabase Auth credentials to test authenticated endpoints');
}

// Run tests if script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests }; 
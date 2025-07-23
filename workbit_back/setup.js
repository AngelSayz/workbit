#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 WorkBit Backend Setup Script');
console.log('=================================\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from .env.example...');
  try {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully!');
    console.log('⚠️  Please edit .env with your actual configuration values.\n');
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
  }
} else {
  console.log('✅ .env file already exists.\n');
}

// Check Node.js version
console.log('🔍 Checking Node.js version...');
try {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  
  if (majorVersion >= 18) {
    console.log(`✅ Node.js ${nodeVersion} is compatible.\n`);
  } else {
    console.log(`⚠️  Node.js ${nodeVersion} detected. Version 18+ is recommended.\n`);
  }
} catch (error) {
  console.error('❌ Failed to check Node.js version:', error.message);
}

// Test dependencies
console.log('📦 Checking dependencies...');
try {
  require('express');
  require('mongoose');
  require('@supabase/supabase-js');
  require('jsonwebtoken');
  require('bcryptjs');
  console.log('✅ All main dependencies are installed.\n');
} catch (error) {
  console.log('⚠️  Some dependencies may be missing. Run: npm install\n');
}

// Create directories if they don't exist
const directories = ['logs', 'tmp'];
directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

console.log('\n🎯 Setup Complete! Next Steps:');
console.log('===============================');
console.log('1. Edit .env file with your configuration:');
console.log('   - Add your Supabase URL and keys');
console.log('   - Add your MongoDB Atlas connection string');
console.log('   - Set a secure JWT_SECRET');
console.log('');
console.log('2. Set up your databases:');
console.log('   - Create Supabase project and run database.sql');
console.log('   - Create MongoDB Atlas cluster');
console.log('');
console.log('3. Start the development server:');
console.log('   npm run dev');
console.log('');
console.log('4. Test the API:');
console.log('   curl http://localhost:3000/health');
console.log('');
console.log('📚 For detailed setup instructions, see README.md');
console.log('🚀 For deployment, see render.yaml or README.md');

// Check if we can read environment variables
console.log('\n🔧 Configuration Check:');
console.log('=======================');

require('dotenv').config();

const requiredEnvVars = [
  'JWT_SECRET',
  'SUPABASE_URL', 
  'SUPABASE_ANON_KEY',
  'MONGODB_URI'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length === 0) {
  console.log('✅ All required environment variables are set!');
  console.log('🎉 You\'re ready to start the server!');
} else {
  console.log('⚠️  Missing environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\nPlease add these to your .env file.');
}

console.log('\n🎉 Setup script completed!');
console.log('Run "npm run dev" to start the development server.'); 
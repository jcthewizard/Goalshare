#!/usr/bin/env node

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

console.log('🔧 Authentication Fix Tool\n');

// Solution 1: Check for JWT secret consistency
console.log('1️⃣ JWT Secret Status:');
console.log('   Current JWT_SECRET:', process.env.JWT_SECRET);
console.log('   Length:', process.env.JWT_SECRET?.length || 0, 'characters');

// Solution 2: Create a test user and token
console.log('\n2️⃣ Creating test credentials for your app:');

const testUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'test@goalshare.com',
  name: 'Test User'
};

const testToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET, {
  expiresIn: '30d' // Longer expiration for testing
});

console.log('   Test Email: test@goalshare.com');
console.log('   Test Password: password123');
console.log('   Test Token:', testToken);

// Solution 3: Instructions to fix the frontend
console.log('\n3️⃣ How to fix your authentication:');
console.log('');
console.log('Option A - Reset your app login:');
console.log('   1. In your React Native app, logout completely');
console.log('   2. Clear app storage/cache');
console.log('   3. Register a new account or login again');
console.log('');
console.log('Option B - Use test credentials:');
console.log('   1. Start your backend server');
console.log('   2. In your app, try logging in with:');
console.log('      Email: test@goalshare.com');
console.log('      Password: password123');
console.log('');
console.log('Option C - Fix token manually (for testing):');
console.log('   1. Replace your stored token with the test token above');
console.log('   2. This will allow immediate testing of theme color saving');

// Solution 4: Create a simple test endpoint
console.log('\n4️⃣ Testing your current setup:');
console.log('   Run these commands to test:');
console.log('   1. npm start (start your backend)');
console.log('   2. curl -H "Authorization: Bearer ' + testToken + '" http://localhost:5001/api/auth/me');

// Solution 5: Check if we need to create the test user
console.log('\n5️⃣ Backend Database Setup:');
console.log('   If you get "user not found" errors, you need to:');
console.log('   1. Register the test user through your app, OR');
console.log('   2. Use the database seeding script');

console.log('\n🎯 Quick Fix Summary:');
console.log('   The "invalid signature" error means your app is using');
console.log('   a token that was created with a different JWT secret.');
console.log('   Simply logout and login again in your app to fix this!');

console.log('\n📱 Next Steps:');
console.log('   1. Start backend: npm start');
console.log('   2. In your React Native app: logout and login again');
console.log('   3. Try changing theme colors - they should now save!');

module.exports = { testToken, testUser }; 
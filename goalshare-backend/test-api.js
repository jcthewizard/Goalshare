const axios = require('axios');

// Config
const API_URL = `http://${process.env.IP}:5001/api`;

const testEmail = 'test@example.com';
const testPassword = 'password123';

async function testAuth() {
  console.log('Testing API endpoints...');
  
  try {
    // Test registration
    console.log('\n1. Testing registration endpoint...');
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, {
        email: testEmail,
        password: testPassword,
        name: 'Test User'
      });
      console.log('Registration successful:', registerResponse.data);
    } catch (error) {
      if (error.response?.data?.message === 'User already exists') {
        console.log('User already exists, continuing with login test...');
      } else {
        console.error('Registration error:', error.response?.data || error.message);
      }
    }
    
    // Test login
    console.log('\n2. Testing login endpoint...');
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: testEmail,
        password: testPassword
      });
      console.log('Login successful!');
      console.log('Token received:', loginResponse.data.token ? 'Yes' : 'No');
      console.log('User data received:', loginResponse.data.user ? 'Yes' : 'No');
      
      // Test auth middleware with the token
      if (loginResponse.data.token) {
        console.log('\n3. Testing authorized endpoint...');
        const token = loginResponse.data.token;
        try {
          const meResponse = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('Auth middleware test successful! User data:', meResponse.data);
        } catch (error) {
          console.error('Auth middleware test failed:', error.response?.data || error.message);
        }
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testAuth(); 
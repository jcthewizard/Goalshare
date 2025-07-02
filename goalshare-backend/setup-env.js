#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up MongoDB environment for Goalshare Backend\n');

const envPath = path.join(__dirname, '.env');

// Create .env file content
const envContent = `# Environment Configuration
NODE_ENV=development
PORT=5001

# MongoDB Configuration
# IMPORTANT: Replace this with your actual MongoDB Atlas connection string
# Get it from: https://cloud.mongodb.com/ -> Connect -> Drivers
MONGO_URI=mongodb+srv://goalshare:goalshare123@cluster0.xxxxx.mongodb.net/goalshare?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=goalshare-jwt-secret-${Math.random().toString(36).substring(2, 15)}
JWT_EXPIRE=30d

# API Configuration
API_VERSION=v1

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:19006,http://localhost:8081,http://192.168.181.206:19006
`;

try {
  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists');
    
    // Read existing content to check MONGO_URI
    const existingContent = fs.readFileSync(envPath, 'utf8');
    const mongoUriMatch = existingContent.match(/MONGO_URI=(.+)/);
    
    if (mongoUriMatch) {
      const currentUri = mongoUriMatch[1];
      console.log('📋 Current MONGO_URI:');
      console.log(`   ${currentUri}\n`);
      
      if (currentUri.includes('xxxxx') || currentUri.includes('<password>')) {
        console.log('❌ Your MONGO_URI needs to be updated with real values!');
        console.log('📝 You need to:');
        console.log('   1. Go to https://cloud.mongodb.com/');
        console.log('   2. Create a free account and cluster');
        console.log('   3. Get your connection string');
        console.log('   4. Replace the MONGO_URI in .env file\n');
      } else {
        console.log('✅ MONGO_URI looks configured');
      }
    } else {
      console.log('❌ No MONGO_URI found in .env file');
    }
  } else {
    // Create new .env file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env file\n');
    
    console.log('📝 Next steps:');
    console.log('1. Go to https://cloud.mongodb.com/');
    console.log('2. Sign up for free account');
    console.log('3. Create a new cluster (M0 FREE tier)');
    console.log('4. Create database user: goalshare / goalshare123');
    console.log('5. Set network access to 0.0.0.0/0 (allow from anywhere)');
    console.log('6. Get connection string and update MONGO_URI in .env');
    console.log('7. Run: npm start\n');
  }

  console.log('🎯 Example of correct MONGO_URI format:');
  console.log('mongodb+srv://goalshare:goalshare123@cluster0.ab1cd.mongodb.net/goalshare?retryWrites=true&w=majority\n');
  
  console.log('🔧 To edit .env file:');
  console.log('   code .env    (if you have VS Code)');
  console.log('   nano .env    (command line editor)');
  console.log('   or open it with any text editor\n');

} catch (error) {
  console.error('❌ Error setting up environment:', error.message);
}

console.log('📚 Need detailed setup instructions?');
console.log('   Visit: https://docs.mongodb.com/atlas/getting-started/'); 
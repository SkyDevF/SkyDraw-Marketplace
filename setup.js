// Setup script for SkyDraw Marketplace
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up SkyDraw Marketplace...');

// Create necessary directories
const directories = [
    'uploads',
    'public/images'
];

directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    } else {
        console.log(`📁 Directory already exists: ${dir}`);
    }
});

// Check if .env file exists
if (!fs.existsSync('.env')) {
    console.log('⚠️  .env file not found!');
    console.log('📋 Please create .env file with the following variables:');
    console.log(`
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_jwt_secret_key
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
GMAIL_USER=your_gmail_address
PROMPTPAY_ID=your_promptpay_id
PORT=3001
    `);
} else {
    console.log('✅ .env file found');
}

// Create default images (placeholder)
const defaultImages = [
    'default-avatar.png',
    'default-artwork.png'
];

defaultImages.forEach(img => {
    const imgPath = path.join('public/images', img);
    if (!fs.existsSync(imgPath)) {
        // Create a simple placeholder file
        fs.writeFileSync(imgPath, '');
        console.log(`📷 Created placeholder: ${img}`);
    }
});

console.log('✅ Setup completed!');
console.log('📖 Please read README.md for detailed setup instructions');
console.log('🚀 Run "npm start" to start the server');
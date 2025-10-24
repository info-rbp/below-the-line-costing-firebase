/**
 * Initialize Admin User Script
 * Creates the initial admin user in Firestore
 * Usage: node scripts/init-admin-user.js
 */

const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error.message);
  console.log('\nPlease ensure you have Firebase credentials set up:');
  console.log('1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable, OR');
  console.log('2. Run: firebase login && gcloud auth application-default login\n');
  process.exit(1);
}

const db = admin.firestore();

// Default admin credentials
const ADMIN_EMAIL = 'admin@jl2group.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'Admin User';

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function createAdminUser() {
  try {
    console.log('🚀 BTL Costing Application - Admin User Initialization');
    console.log('=' .repeat(60));
    
    // Check if admin user already exists
    console.log('\n📋 Checking for existing admin user...');
    const existingUsers = await db.collection('users')
      .where('email', '==', ADMIN_EMAIL)
      .limit(1)
      .get();
    
    if (!existingUsers.empty) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log('\n❓ Do you want to reset the password? (This will update the existing user)');
      console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Update existing user
      const userDoc = existingUsers.docs[0];
      const password_hash = await hashPassword(ADMIN_PASSWORD);
      
      await userDoc.ref.update({
        password_hash,
        is_active: true,
        updated_at: new Date().toISOString()
      });
      
      console.log('✅ Admin user password reset successfully!');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      console.log('=' .repeat(60));
      return;
    }
    
    // Create new admin user
    console.log('📝 Creating new admin user...');
    const password_hash = await hashPassword(ADMIN_PASSWORD);
    
    const adminUser = {
      email: ADMIN_EMAIL,
      password_hash,
      full_name: ADMIN_NAME,
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const userRef = await db.collection('users').add(adminUser);
    
    console.log('\n✅ Admin user created successfully!');
    console.log('=' .repeat(60));
    console.log('\n📧 Login Credentials:');
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   User ID:  ${userRef.id}`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    throw error;
  } finally {
    // Close the connection
    await admin.app().delete();
  }
}

// Run the script
createAdminUser()
  .then(() => {
    console.log('\n🎉 Initialization complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Initialization failed:', error);
    process.exit(1);
  });

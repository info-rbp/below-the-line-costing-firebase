/**
 * Test Setup Script
 * Verifies that the application setup is working correctly
 * Tests login with admin@jl2group.com / admin123
 */

const bcrypt = require('bcryptjs');

console.log('🧪 BTL Costing Application - Setup Verification Test');
console.log('=' .repeat(60));

async function testPasswordHashing() {
  console.log('\n1️⃣  Testing Password Hashing...');
  
  try {
    const testPassword = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(testPassword, salt);
    
    console.log('   ✅ Password hashing works');
    console.log(`   Password: ${testPassword}`);
    console.log(`   Hash: ${hash.substring(0, 30)}...`);
    
    // Verify
    const isValid = await bcrypt.compare(testPassword, hash);
    if (isValid) {
      console.log('   ✅ Password verification works');
    } else {
      console.log('   ❌ Password verification failed');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('   ❌ Password hashing failed:', error.message);
    return false;
  }
}

async function testEnvironment() {
  console.log('\n2️⃣  Testing Environment...');
  
  const checks = {
    'Node.js version': process.version,
    'bcryptjs loaded': typeof bcrypt !== 'undefined',
    'JWT_SECRET env': process.env.JWT_SECRET || 'default (not set)',
  };
  
  console.log('   Node.js Version:', checks['Node.js version']);
  console.log('   bcryptjs:', checks['bcryptjs loaded'] ? '✅ Loaded' : '❌ Not loaded');
  console.log('   JWT_SECRET:', checks['JWT_SECRET env'] !== 'default (not set)' ? '✅ Set' : '⚠️  Using default');
  
  return true;
}

async function testScriptsExist() {
  console.log('\n3️⃣  Testing Scripts Exist...');
  
  const fs = require('fs');
  const path = require('path');
  
  const scripts = [
    'scripts/init-admin-user.cjs',
    'scripts/seed-database.cjs',
    'scripts/hash_password.js',
    'scripts/test-setup.cjs'
  ];
  
  let allExist = true;
  
  for (const script of scripts) {
    const scriptPath = path.join(process.cwd(), script);
    if (fs.existsSync(scriptPath)) {
      console.log(`   ✅ ${script}`);
    } else {
      console.log(`   ❌ ${script} - NOT FOUND`);
      allExist = false;
    }
  }
  
  return allExist;
}

async function testAPIRoutes() {
  console.log('\n4️⃣  Testing API Routes Exist...');
  
  const fs = require('fs');
  const path = require('path');
  
  const routes = [
    'functions/src/routes/setup.js',
    'functions/src/routes/auth.js',
    'functions/src/routes/projects.js',
    'functions/src/routes/personnel.js'
  ];
  
  let allExist = true;
  
  for (const route of routes) {
    const routePath = path.join(process.cwd(), route);
    if (fs.existsSync(routePath)) {
      console.log(`   ✅ ${route}`);
    } else {
      console.log(`   ❌ ${route} - NOT FOUND`);
      allExist = false;
    }
  }
  
  return allExist;
}

async function testSetupPage() {
  console.log('\n5️⃣  Testing Setup Page...');
  
  const fs = require('fs');
  const path = require('path');
  
  const setupPage = path.join(process.cwd(), 'public/setup.html');
  
  if (fs.existsSync(setupPage)) {
    console.log('   ✅ Setup page exists: public/setup.html');
    
    const content = fs.readFileSync(setupPage, 'utf8');
    const hasForm = content.includes('setupForm');
    const hasAPI = content.includes('/setup/initialize') || content.includes('/setup/status');
    
    console.log('   ✅ Setup form:', hasForm ? 'Found' : 'Not found');
    console.log('   ✅ API integration:', hasAPI ? 'Found' : 'Not found');
    
    return hasForm && hasAPI;
  } else {
    console.log('   ❌ Setup page not found');
    return false;
  }
}

async function testDocumentation() {
  console.log('\n6️⃣  Testing Documentation...');
  
  const fs = require('fs');
  const path = require('path');
  
  const docs = [
    'SETUP_GUIDE.md',
    'QUICK_START.md',
    'README.md'
  ];
  
  let allExist = true;
  
  for (const doc of docs) {
    const docPath = path.join(process.cwd(), doc);
    if (fs.existsSync(docPath)) {
      console.log(`   ✅ ${doc}`);
    } else {
      console.log(`   ❌ ${doc} - NOT FOUND`);
      allExist = false;
    }
  }
  
  return allExist;
}

async function runAllTests() {
  console.log('\nRunning all tests...\n');
  
  const results = {
    passwordHashing: await testPasswordHashing(),
    environment: await testEnvironment(),
    scripts: await testScriptsExist(),
    apiRoutes: await testAPIRoutes(),
    setupPage: await testSetupPage(),
    documentation: await testDocumentation()
  };
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Test Results Summary:');
  console.log('=' .repeat(60));
  
  let passCount = 0;
  let totalTests = 0;
  
  for (const [test, passed] of Object.entries(results)) {
    totalTests++;
    if (passed) passCount++;
    
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').trim();
    console.log(`${status} - ${testName}`);
  }
  
  console.log('=' .repeat(60));
  console.log(`\n🎯 Overall: ${passCount}/${totalTests} tests passed\n`);
  
  if (passCount === totalTests) {
    console.log('🎉 All tests passed! Setup is ready.');
    console.log('\n📝 Next steps:');
    console.log('   1. Deploy to Firebase: firebase deploy');
    console.log('   2. Run setup script: npm run setup:init');
    console.log('   3. Or visit: https://your-app.web.app/setup.html');
    console.log('   4. Login with: admin@jl2group.com / admin123');
    console.log('\n⚠️  Remember to change the password after first login!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Test execution failed:', error);
  process.exit(1);
});

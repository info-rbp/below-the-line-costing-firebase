/**
 * Password hashing utility for BTL Costing Application
 * Usage: node scripts/hash_password.js <password>
 */

const bcrypt = require('bcryptjs');

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

// Get password from command line argument
const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash_password.js <password>');
  process.exit(1);
}

hashPassword(password).then(hash => {
  console.log('\n==============================================');
  console.log('Password Hash Generated Successfully!');
  console.log('==============================================\n');
  console.log('Original Password:', password);
  console.log('\nHashed Password:');
  console.log(hash);
  console.log('\n==============================================');
  console.log('Copy the hash above and use it in Firestore');
  console.log('for the password_hash field.');
  console.log('==============================================\n');
}).catch(err => {
  console.error('Error generating hash:', err);
  process.exit(1);
});

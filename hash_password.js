// Generate password hashes compatible with our auth system

async function hashPassword(password) {
  const salt = crypto.randomUUID();
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${salt}:${hashHex}`;
}

(async () => {
  const password = 'admin123';
  const hash = await hashPassword(password);
  console.log(`Password hash for '${password}':`);
  console.log(hash);
})();

/**
 * Database Seeding Script
 * Seeds default data for BTL Costing Application
 * Usage: node scripts/seed-database.js
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

// Default rate bands data
const defaultRateBands = [
  {
    band_name: 'Junior',
    hourly_rate: 50.00,
    description: 'Entry-level staff',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    band_name: 'Mid-Level',
    hourly_rate: 85.00,
    description: 'Experienced professionals',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    band_name: 'Senior',
    hourly_rate: 125.00,
    description: 'Senior consultants and specialists',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    band_name: 'Principal',
    hourly_rate: 175.00,
    description: 'Principal consultants and directors',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Default materials master data
const defaultMaterials = [
  {
    material_code: 'MAT-001',
    material_name: 'Marketing Collateral - Brochures',
    category: 'Marketing Materials',
    unit_of_measure: 'piece',
    unit_cost: 2.50,
    supplier: 'PrintCo',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    material_code: 'MAT-002',
    material_name: 'Promotional T-Shirts',
    category: 'Promotional Items',
    unit_of_measure: 'piece',
    unit_cost: 8.00,
    supplier: 'ApparelPro',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    material_code: 'MAT-003',
    material_name: 'Event Banners',
    category: 'Event Materials',
    unit_of_measure: 'each',
    unit_cost: 45.00,
    supplier: 'SignageWorld',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    material_code: 'MAT-004',
    material_name: 'Branded Pens',
    category: 'Promotional Items',
    unit_of_measure: 'piece',
    unit_cost: 0.50,
    supplier: 'OfficeSupply',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Sample client data
const defaultClients = [
  {
    client_name: 'Acme Corporation',
    client_code: 'ACME-001',
    industry: 'Technology',
    contact_person: 'John Smith',
    contact_email: 'john.smith@acme.com',
    contact_phone: '+1-555-0101',
    address: '123 Tech Street, Silicon Valley, CA 94025',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    client_name: 'Global Marketing Inc',
    client_code: 'GLMKT-001',
    industry: 'Marketing',
    contact_person: 'Sarah Johnson',
    contact_email: 'sarah@globalmarketing.com',
    contact_phone: '+1-555-0102',
    address: '456 Marketing Ave, New York, NY 10001',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function seedCollection(collectionName, data, checkField = 'name') {
  console.log(`\n📦 Seeding ${collectionName}...`);
  
  try {
    let added = 0;
    let skipped = 0;
    
    for (const item of data) {
      // Check if item already exists
      const fieldToCheck = item[checkField] || Object.values(item)[0];
      const existing = await db.collection(collectionName)
        .where(checkField, '==', fieldToCheck)
        .limit(1)
        .get();
      
      if (existing.empty) {
        await db.collection(collectionName).add(item);
        added++;
      } else {
        skipped++;
      }
    }
    
    console.log(`   ✅ Added: ${added}, Skipped (already exists): ${skipped}`);
  } catch (error) {
    console.error(`   ❌ Error seeding ${collectionName}:`, error.message);
  }
}

async function seedDatabase() {
  try {
    console.log('🌱 BTL Costing Application - Database Seeding');
    console.log('=' .repeat(60));
    
    // Seed rate bands
    await seedCollection('rateBands', defaultRateBands, 'band_name');
    
    // Seed materials master
    await seedCollection('materialsMaster', defaultMaterials, 'material_code');
    
    // Seed clients
    await seedCollection('clients', defaultClients, 'client_code');
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ Database seeding completed successfully!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n❌ Database seeding failed:', error);
    throw error;
  } finally {
    await admin.app().delete();
  }
}

// Run the script
seedDatabase()
  .then(() => {
    console.log('\n🎉 Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Seeding failed:', error);
    process.exit(1);
  });

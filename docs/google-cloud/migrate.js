import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const { Client } = pg

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })

  try {
    console.log('🔄 Connecting to PostgreSQL database...')
    await client.connect()
    console.log('✅ Connected successfully')

    // Get migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations-postgres')
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()

    console.log(`\n📂 Found ${files.length} migration file(s):\n`)

    for (const file of files) {
      console.log(`⏳ Running migration: ${file}`)
      const sqlPath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(sqlPath, 'utf8')

      try {
        await client.query(sql)
        console.log(`✅ Completed: ${file}\n`)
      } catch (error) {
        console.error(`❌ Error in ${file}:`, error.message)
        throw error
      }
    }

    console.log('🎉 All migrations completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigrations()

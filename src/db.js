/**
 * Database utility functions for PostgreSQL
 * This replaces the D1 database interface with PostgreSQL
 */

/**
 * Execute a query and return all results
 * @param {import('pg').Pool} pool - PostgreSQL connection pool
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<{success: boolean, results: Array, error?: string}>}
 */
export async function queryAll(pool, query, params = []) {
  try {
    const result = await pool.query(query, params)
    return { success: true, results: result.rows }
  } catch (error) {
    console.error('Database query error:', error)
    return { success: false, results: [], error: error.message }
  }
}

/**
 * Execute a query and return first result
 * @param {import('pg').Pool} pool - PostgreSQL connection pool
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<{success: boolean, result: Object|null, error?: string}>}
 */
export async function queryOne(pool, query, params = []) {
  try {
    const result = await pool.query(query, params)
    return { success: true, result: result.rows[0] || null }
  } catch (error) {
    console.error('Database query error:', error)
    return { success: false, result: null, error: error.message }
  }
}

/**
 * Execute an INSERT/UPDATE/DELETE query
 * @param {import('pg').Pool} pool - PostgreSQL connection pool
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<{success: boolean, rowCount: number, insertId?: number, error?: string}>}
 */
export async function execute(pool, query, params = []) {
  try {
    const result = await pool.query(query, params)
    return { 
      success: true, 
      rowCount: result.rowCount,
      insertId: result.rows[0]?.id // For RETURNING id queries
    }
  } catch (error) {
    console.error('Database execute error:', error)
    return { success: false, rowCount: 0, error: error.message }
  }
}

/**
 * Execute a transaction (multiple queries)
 * @param {import('pg').Pool} pool - PostgreSQL connection pool
 * @param {Function} callback - Async function that receives client
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function transaction(pool, callback) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await callback(client)
    await client.query('COMMIT')
    return { success: true }
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Transaction error:', error)
    return { success: false, error: error.message }
  } finally {
    client.release()
  }
}

/**
 * Convert D1-style prepare().bind().all() to PostgreSQL
 * Usage: const { results } = await prepare(pool, query, params).all()
 */
export function prepare(pool, query, params = []) {
  // Convert ? placeholders to $1, $2, etc. for PostgreSQL
  let paramIndex = 1
  const pgQuery = query.replace(/\?/g, () => `$${paramIndex++}`)
  
  return {
    async all() {
      return queryAll(pool, pgQuery, params)
    },
    async first() {
      return queryOne(pool, pgQuery, params)
    },
    async run() {
      return execute(pool, pgQuery, params)
    }
  }
}

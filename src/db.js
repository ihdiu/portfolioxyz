import mysql from 'mysql2/promise';
import { config } from './config.js';

export const pool = mysql.createPool({
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: 'Z',
});

/**
 * Execute a query with parameters using the connection pool
 * @param {string} sql - Prepared statement SQL
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} [rows, fields]
 */
export async function query(sql, params = []) {
  return pool.execute(sql, params);
}

/**
 * Health check helper
 */
export async function ping() {
  const [rows] = await pool.query('SELECT 1 AS healthy');
  return rows[0]?.healthy === 1;
}

export default { pool, query, ping };

const mysql = require('mysql2/promise')
require('dotenv').config()

let pool

const cfg = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  charset: 'utf8mb4',
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ssl: { rejectUnauthorized: false }
}

const url = process.env.MYSQL_URL || process.env.DATABASE_URL
if (url) {
  const u = new URL(url)
  cfg.host     = u.hostname
  cfg.port     = parseInt(u.port || '3306')
  cfg.user     = u.username
  cfg.password = u.password
  cfg.database = u.pathname.slice(1)
}

pool = mysql.createPool(cfg)

module.exports = pool

const mysql = require('mysql2/promise');
const { DB_CONFIG } = require('./constants');

const pool = mysql.createPool(DB_CONFIG);

module.exports = pool;
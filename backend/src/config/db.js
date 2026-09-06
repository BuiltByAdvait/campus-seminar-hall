"use strict";

const mysql = require('mysql2');
const config = require('./env');
const logger = require('./logger');

// Create connection pool
const pool = mysql.createPool({
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    charset: 'utf8mb4',
    timezone: '+05:30', // IST
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 30000,
    timeout: 30000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        logger.error('Database connection failed:', err.message);
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
    } else {
        logger.info(`Database connected: ${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`);
        connection.release();
    }
});

// Promise-based wrapper for pool
const promisePool = pool.promise();

// Helper to execute queries
const query = (sql, params = []) => {
    return promisePool.execute(sql, params);
};

// Helper for single row
const queryOne = async (sql, params = []) => {
    const [rows] = await promisePool.execute(sql, params);
    return rows[0] || null;
};

// Helper for multiple rows
const queryAll = async (sql, params = []) => {
    const [rows] = await promisePool.execute(sql, params);
    return rows;
};

// Transaction helper
const transaction = async (callback) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.query('START TRANSACTION');
        const result = await callback(connection);
        await connection.query('COMMIT');
        return result;
    } catch (error) {
        await connection.query('ROLLBACK');
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    pool,
    promisePool,
    query,
    queryOne,
    queryAll,
    transaction
};
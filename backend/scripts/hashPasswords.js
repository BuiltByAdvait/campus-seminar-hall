/**
 * Hash seed user passwords
 * Run: node scripts/hashPasswords.js
 */
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

const BCRYPT_ROUNDS = 12;

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        charset: 'utf8mb4'
    });

    console.log('Hashing passwords for seed users...');

    const password = 'Password123!';
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Update all TEMP_HASH users
    const [result] = await connection.execute(
        'UPDATE users SET password_hash = ? WHERE password_hash = ?',
        [hash, 'TEMP_HASH']
    );

    console.log(`Updated ${result.affectedRows} user passwords`);
    console.log(`All users can now login with password: ${password}`);

    await connection.end();
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

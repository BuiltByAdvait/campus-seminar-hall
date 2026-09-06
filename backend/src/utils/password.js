"use strict";

const bcrypt = require('bcrypt');
const config = require('../config/env');

/**
 * Hash a password
 * @param {string} plainPassword - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (plainPassword) => {
    return bcrypt.hash(plainPassword, config.BCRYPT_SALT_ROUNDS);
};

/**
 * Compare password with hash
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password
 * @returns {Promise<boolean>} True if match
 */
const comparePassword = async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
const validatePasswordStrength = (password) => {
    const errors = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one digit');
    }
    if (!/[!@#$%^&*]/.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

module.exports = {
    hashPassword,
    comparePassword,
    validatePasswordStrength
};
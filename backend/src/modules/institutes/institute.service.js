"use strict";

const db = require('../../config/db');
const { APP_ERROR, NotFoundError, ConflictError } = require('../../utils/errors');
const logger = require('../../config/logger');

/**
 * Institute service
 */
const instituteService = {
    /**
     * Get all institutes
     * @returns {Promise<Array>} List of institutes
     */
    getAll: async () => {
        const [rows] = await db.query(
            `SELECT i.*,
                    (SELECT COUNT(*) FROM departments d WHERE d.institute_id = i.id AND d.deleted_at IS NULL) as department_count
             FROM institutes i
             WHERE i.deleted_at IS NULL
             ORDER BY i.name`
        );
        return rows;
    },

    /**
     * Get institute by ID
     * @param {number} instituteId - Institute ID
     * @returns {Promise<Object>} Institute data
     */
    getById: async (instituteId) => {
        const [rows] = await db.query(
            'SELECT * FROM institutes WHERE id = ? AND deleted_at IS NULL',
            [instituteId]
        );

        if (!rows[0]) {
            throw new NotFoundError('Institute not found');
        }

        return rows[0];
    },

    /**
     * Create new institute
     * @param {Object} instituteData - Institute data
     * @returns {Promise<Object>} Created institute
     */
    create: async (instituteData) => {
        const { code, name, shortName, address, contactEmail, contactPhone } = instituteData;

        // Check if code already exists
        const existing = await db.queryOne(
            'SELECT id FROM institutes WHERE code = ? AND deleted_at IS NULL',
            [code]
        );

        if (existing) {
            throw new ConflictError('Institute code already exists');
        }

        const [result] = await db.query(
            `INSERT INTO institutes (code, name, short_name, address, contact_email, contact_phone)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [code, name, shortName || null, address || null, contactEmail || null, contactPhone || null]
        );

        const instituteId = result.insertId;
        return instituteService.getById(instituteId);
    },

    /**
     * Update institute
     * @param {number} instituteId - Institute ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated institute
     */
    update: async (instituteId, updates) => {
        const allowedFields = ['name', 'short_name', 'address', 'contact_email', 'contact_phone', 'is_active'];
        const fields = [];
        const values = [];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                if (field.includes('_')) {
                    fields.push(`${field} = ?`);
                } else {
                    fields.push(`${field} = ?`);
                }
                values.push(updates[field]);
            }
        }

        if (fields.length === 0) {
            throw new APP_ERROR('No valid fields to update', 400);
        }

        values.push(instituteId);

        await db.query(
            `UPDATE institutes SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
            values
        );

        return instituteService.getById(instituteId);
    },

    /**
     * Delete institute (soft delete)
     * @param {number} instituteId - Institute ID
     * @returns {Promise<void>}
     */
    delete: async (instituteId) => {
        await db.query(
            'UPDATE institutes SET deleted_at = NOW() WHERE id = ?',
            [instituteId]
        );
    }
};

module.exports = instituteService;
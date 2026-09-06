"use strict";

const db = require('../../config/db');
const { APP_ERROR, NotFoundError, ConflictError } = require('../../utils/errors');

const departmentService = {
    getAll: async (instituteId = null) => {
        let query = `SELECT d.*, i.name AS institute_name
                     FROM departments d
                     LEFT JOIN institutes i ON d.institute_id = i.id AND i.deleted_at IS NULL
                     WHERE d.deleted_at IS NULL`;
        const params = [];

        if (instituteId) {
            query += ' AND d.institute_id = ?';
            params.push(instituteId);
        }

        query += ' ORDER BY d.name';

        const [rows] = await db.query(query, params);
        return rows;
    },

    getById: async (id) => {
        const [rows] = await db.query(
            `SELECT d.*, i.name AS institute_name
             FROM departments d
             LEFT JOIN institutes i ON d.institute_id = i.id AND i.deleted_at IS NULL
             WHERE d.id = ? AND d.deleted_at IS NULL`,
            [id]
        );

        if (!rows[0]) {
            throw new NotFoundError('Department not found');
        }

        return rows[0];
    },

    create: async (data) => {
        const { instituteId, code, name, shortName, hodName, hodEmail, hodPhone } = data;

        // Check institute exists
        const institute = await db.queryOne(
            'SELECT id FROM institutes WHERE id = ? AND deleted_at IS NULL',
            [instituteId]
        );

        if (!institute) {
            throw new NotFoundError('Institute not found');
        }

        // Check for duplicate code within institute
        const existing = await db.queryOne(
            'SELECT id FROM departments WHERE institute_id = ? AND code = ? AND deleted_at IS NULL',
            [instituteId, code]
        );

        if (existing) {
            throw new ConflictError('Department code already exists in this institute');
        }

        const [result] = await db.query(
            `INSERT INTO departments (institute_id, code, name, short_name, hod_name, hod_email, hod_phone)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [instituteId, code, name, shortName || null, hodName || null, hodEmail || null, hodPhone || null]
        );

        return departmentService.getById(result.insertId);
    },

    update: async (id, data) => {
        const allowedFields = ['name', 'short_name', 'hod_name', 'hod_email', 'hod_phone', 'is_active'];
        const fields = [];
        const values = [];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(data[field]);
            }
        }

        if (fields.length === 0) {
            throw new APP_ERROR('No valid fields to update', 400);
        }

        values.push(id);

        await db.query(
            `UPDATE departments SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
            values
        );

        return departmentService.getById(id);
    },

    delete: async (id) => {
        await db.query(
            'UPDATE departments SET deleted_at = NOW() WHERE id = ?',
            [id]
        );
    }
};

module.exports = departmentService;
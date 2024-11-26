const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { verifyToken, checkRole, JWT_SECRET, JWT_EXPIRATION } = require('../middleware/auth');
const { createUser, getRefIdByUserId, getUserByRefId } = require('../utils/db_utils');
const db = new sqlite3.Database('./disaster_relief.db');

// Admin registration (first admin only)
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone_number, address, password } = req.body;

        // Check if admin exists
        const adminExists = await new Promise((resolve, reject) => {
            req.db.get('SELECT * FROM users WHERE role = ?', ['admin'], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (adminExists) {
            return res.status(403).json({ message: 'Admin already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));

        // Create admin user with ref_id
        const userData = {
            name,
            email,
            phone_number,
            address,
            password: hashedPassword,
            role: 'admin'
        };

        const user = await createUser(userData);
        const ref_id = await getRefIdByUserId(user.id);

        // Generate JWT token
        const token = jwt.sign({ ref_id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

        res.status(201).json({
            message: 'Admin registered successfully',
            token
        });
    } catch (error) {
        console.error('Error registering admin:', error);
        res.status(500).json({ message: 'Error registering admin' });
    }
});

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin by email
        const admin = await new Promise((resolve, reject) => {
            req.db.get('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'admin'], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Get ref_id for the admin
        const ref_id = await getRefIdByUserId(admin.id);
        if (!ref_id) {
            return res.status(500).json({ message: 'Error retrieving admin reference' });
        }

        // Generate JWT token
        const token = jwt.sign({ ref_id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

        res.json({
            message: 'Login successful',
            token
        });
    } catch (error) {
        console.error('Error logging in admin:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Protected admin routes
router.use(verifyToken);
router.use(checkRole(['admin']));

// Create moderator
router.post('/create-moderator', async (req, res) => {
    try {
        const { name, email, phone_number, address, password } = req.body;

        // Check if email already exists
        const emailExists = await new Promise((resolve, reject) => {
            req.db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (emailExists) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));

        // Create moderator user
        const userData = {
            name,
            email,
            phone_number,
            address,
            password: hashedPassword,
            role: 'moderator'
        };

        const user = await createUser(userData);
        const ref_id = await getRefIdByUserId(user.id);

        res.status(201).json({
            message: 'Moderator created successfully',
            data: {
                ref_id,
                name,
                email,
                phone_number,
                address,
                role: 'moderator'
            }
        });
    } catch (error) {
        console.error('Error creating moderator:', error);
        res.status(500).json({ message: 'Error creating moderator' });
    }
});

// Get all users (with optional role filter)
router.get('/users', async (req, res) => {
    try {
        const { role } = req.query;
        let query = `
            SELECT u.id, u.name, u.email, u.phone_number, u.address, u.role, ur.ref_id,
                   u.created_at
            FROM users u
            JOIN user_refs ur ON ur.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (role && ['user', 'moderator', 'admin'].includes(role)) {
            query += ' AND u.role = ?';
            params.push(role);
        }

        query += ' ORDER BY u.created_at DESC';

        const users = await new Promise((resolve, reject) => {
            req.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        res.json(users);
    } catch (error) {
        console.error('Error retrieving users:', error);
        res.status(500).json({ message: 'Error retrieving users' });
    }
});

// Update user role
router.put('/users/:ref_id/role', async (req, res) => {
    try {
        const { ref_id } = req.params;
        const { new_role } = req.body;

        if (!['user', 'moderator'].includes(new_role)) {
            return res.status(400).json({ message: 'Invalid role. Must be "user" or "moderator"' });
        }

        // Don't allow changing own role
        if (ref_id === req.user.ref_id) {
            return res.status(400).json({ message: 'Cannot change your own role' });
        }

        // Get user details
        const user = await getUserByRefId(ref_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Don't allow modifying other admins
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot modify admin roles' });
        }

        // Update user role
        await new Promise((resolve, reject) => {
            req.db.run(
                'UPDATE users SET role = ? WHERE id = ?',
                [new_role, user.id],
                err => {
                    if (err) reject(err);
                    resolve();
                }
            );
        });

        res.json({
            message: 'User role updated successfully',
            data: {
                ref_id,
                previous_role: user.role,
                new_role
            }
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Error updating user role' });
    }
});

// Get API Logs
router.get('/logs', async (req, res) => {
    try {
        const { start_date, end_date, user_ref_id, action, method } = req.query;
        let query = `
            SELECT l.*, u.name as user_name, u.role as user_role
            FROM api_logs l
            LEFT JOIN user_refs ur ON ur.ref_id = l.user_ref_id
            LEFT JOIN users u ON u.id = ur.user_id
            WHERE 1=1
        `;
        const params = [];

        if (start_date) {
            query += ' AND l.timestamp >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND l.timestamp <= ?';
            params.push(end_date);
        }

        if (user_ref_id) {
            query += ' AND l.user_ref_id = ?';
            params.push(user_ref_id);
        }

        if (action) {
            query += ' AND l.action = ?';
            params.push(action);
        }

        if (method) {
            query += ' AND l.method = ?';
            params.push(method);
        }

        query += ' ORDER BY l.timestamp DESC LIMIT 100';

        const logs = await new Promise((resolve, reject) => {
            req.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        res.json({
            message: 'Logs retrieved successfully',
            data: logs
        });
    } catch (error) {
        console.error('Error retrieving logs:', error);
        res.status(500).json({ message: 'Error retrieving logs' });
    }
});

module.exports = router;

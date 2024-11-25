const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken, checkRole, JWT_SECRET, JWT_EXPIRATION } = require('../middleware/auth');
const { createUser } = require('../utils/db_utils');

// Register first admin
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

        // Generate JWT token
        const token = jwt.sign({ ref_id: user.ref_id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

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

        // Generate JWT token
        const token = jwt.sign({ ref_id: admin.ref_id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

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

        // Hash password
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));

        // Create moderator user with ref_id
        const userData = {
            name,
            email,
            phone_number,
            address,
            password: hashedPassword,
            role: 'moderator'
        };

        await createUser(userData);

        res.status(201).json({
            message: 'Moderator created successfully'
        });
    } catch (error) {
        console.error('Error creating moderator:', error);
        res.status(500).json({ message: 'Error creating moderator' });
    }
});

module.exports = router;

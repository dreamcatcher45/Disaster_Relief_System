const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { verifyToken, checkRole, JWT_SECRET, JWT_EXPIRATION } = require('../middleware/auth');
const { createUser } = require('../utils/db_utils');
const db = new sqlite3.Database('./disaster_relief.db');

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone_number, address, password } = req.body;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));

        // Create user with ref_id
        const userData = {
            name,
            email,
            phone_number,
            address,
            password: hashedPassword,
            role: 'user'
        };

        const user = await createUser(userData);

        // Generate JWT token
        const token = jwt.sign({ ref_id: user.ref_id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

        res.status(201).json({
            message: 'User registered successfully',
            token
        });
    } catch (error) {
        console.error('Error registering user:', error);
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ message: 'Email or phone number already exists' });
        }
        res.status(500).json({ message: 'Error registering user' });
    }
});

// User login
router.post('/login', async (req, res) => {
    try {
        const { phone_number, password } = req.body;

        // Find user by phone_number
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE phone_number = ? AND role = ?', [phone_number, 'user'], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ ref_id: user.ref_id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

        res.json({
            message: 'Login successful',
            token
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { verifyToken, checkRole, JWT_SECRET, JWT_EXPIRATION } = require('../middleware/auth');
const { getRefIdByUserId } = require('../utils/db_utils');
const db = new sqlite3.Database('./disaster_relief.db');

// Moderator login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find moderator by email
        const moderator = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'moderator'], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!moderator) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, moderator.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Get ref_id for the moderator
        const ref_id = await getRefIdByUserId(moderator.id);
        if (!ref_id) {
            return res.status(500).json({ message: 'Error retrieving moderator reference' });
        }

        // Generate JWT token using ref_id
        const token = jwt.sign({ ref_id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

        res.json({
            message: 'Login successful',
            token
        });
    } catch (error) {
        console.error('Error logging in moderator:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Protected moderator routes
router.use(verifyToken);
router.use(checkRole(['moderator', 'admin']));

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { verifyToken, checkRole, JWT_SECRET, JWT_EXPIRATION } = require('../middleware/auth');
const { createUser, getRefIdByUserId } = require('../utils/db_utils');
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
        const ref_id = await getRefIdByUserId(user.id);

        // Generate JWT token
        const token = jwt.sign({ ref_id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

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

        // Get ref_id for the user
        const ref_id = await getRefIdByUserId(user.id);
        if (!ref_id) {
            return res.status(500).json({ message: 'Error retrieving user reference' });
        }

        // Generate JWT token
        const token = jwt.sign({ ref_id }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

        res.json({
            message: 'Login successful',
            token,
            user: {
                name: user.name,
                role: user.role,
                ref_id
            }
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Create a new support request
router.post('/support-requests', verifyToken, checkRole('user'), async (req, res) => {
    const db = req.db;
    const userRefId = req.user.ref_id;

    try {
        const { help_request_id, items, notes } = req.body;

        // Validate help request exists and is active
        const helpRequest = await new Promise((resolve, reject) => {
            db.get(
                'SELECT id, status, logistic_status FROM help_requests WHERE id = ?',
                [help_request_id],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });

        if (!helpRequest) {
            return res.status(404).json({ message: 'Help request not found' });
        }

        if (helpRequest.status !== 'active') {
            return res.status(400).json({ message: 'Help request is no longer active' });
        }

        // Start transaction
        await new Promise((resolve, reject) => {
            db.run('BEGIN TRANSACTION', err => {
                if (err) reject(err);
                resolve();
            });
        });

        try {
            // Create support request
            const result = await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO support_requests (help_request_id, user_ref_id, notes)
                     VALUES (?, ?, ?)`,
                    [help_request_id, userRefId, notes],
                    function(err) {
                        if (err) reject(err);
                        resolve(this.lastID);
                    }
                );
            });

            const supportRequestId = result;

            // Validate and insert support request items
            for (const item of items) {
                // Verify item exists and quantity is valid
                const requestItem = await new Promise((resolve, reject) => {
                    db.get(
                        `SELECT id, qty, received_qty, need_qty 
                         FROM request_items 
                         WHERE id = ? AND help_request_id = ?`,
                        [item.request_item_id, help_request_id],
                        (err, row) => {
                            if (err) reject(err);
                            resolve(row);
                        }
                    );
                });

                if (!requestItem) {
                    throw new Error(`Item with id ${item.request_item_id} not found in help request`);
                }

                const remainingNeed = requestItem.need_qty - requestItem.received_qty;
                if (item.quantity_offered <= 0 || item.quantity_offered > remainingNeed) {
                    throw new Error(`Invalid quantity offered for item ${item.request_item_id}. Maximum allowed: ${remainingNeed}`);
                }

                // Insert support request item
                await new Promise((resolve, reject) => {
                    db.run(
                        `INSERT INTO support_request_items 
                         (support_request_id, request_item_id, quantity_offered, notes)
                         VALUES (?, ?, ?, ?)`,
                        [supportRequestId, item.request_item_id, item.quantity_offered, item.notes],
                        err => {
                            if (err) reject(err);
                            resolve();
                        }
                    );
                });
            }

            // Commit transaction
            await new Promise((resolve, reject) => {
                db.run('COMMIT', err => {
                    if (err) reject(err);
                    resolve();
                });
            });

            // Fetch the created support request with items
            const supportRequest = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT sr.*, hr.title as help_request_title
                     FROM support_requests sr
                     JOIN help_requests hr ON hr.id = sr.help_request_id
                     WHERE sr.id = ?`,
                    [supportRequestId],
                    (err, row) => {
                        if (err) reject(err);
                        resolve(row);
                    }
                );
            });

            const supportRequestItems = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT sri.*, ri.name
                     FROM support_request_items sri
                     JOIN request_items ri ON ri.id = sri.request_item_id
                     WHERE sri.support_request_id = ?`,
                    [supportRequestId],
                    (err, rows) => {
                        if (err) reject(err);
                        resolve(rows);
                    }
                );
            });

            res.status(201).json({
                message: 'Support request created successfully',
                data: {
                    ...supportRequest,
                    items: supportRequestItems
                }
            });

        } catch (error) {
            await new Promise((resolve, reject) => {
                db.run('ROLLBACK', err => {
                    if (err) reject(err);
                    resolve();
                });
            });
            throw error;
        }

    } catch (error) {
        console.error('Error creating support request:', error);
        res.status(error.message.includes('not found') ? 404 : 400).json({ 
            message: error.message || 'Internal server error' 
        });
    }
});

// Get user's support requests
router.get('/support-requests', verifyToken, checkRole('user'), async (req, res) => {
    const db = req.db;
    const userRefId = req.user.ref_id;

    try {
        const supportRequests = await new Promise((resolve, reject) => {
            db.all(
                `SELECT sr.*, hr.title as help_request_title
                 FROM support_requests sr
                 JOIN help_requests hr ON hr.id = sr.help_request_id
                 WHERE sr.user_ref_id = ?
                 ORDER BY sr.created_at DESC`,
                [userRefId],
                (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                }
            );
        });

        // Get items for each support request
        for (let request of supportRequests) {
            request.items = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT sri.*, ri.name
                     FROM support_request_items sri
                     JOIN request_items ri ON ri.id = sri.request_item_id
                     WHERE sri.support_request_id = ?`,
                    [request.id],
                    (err, rows) => {
                        if (err) reject(err);
                        resolve(rows);
                    }
                );
            });

            // Get latest logistics status if any
            const latestLogistics = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT new_status, timestamp
                     FROM logistics_tracking
                     WHERE support_request_id = ?
                     ORDER BY timestamp DESC
                     LIMIT 1`,
                    [request.id],
                    (err, row) => {
                        if (err) reject(err);
                        resolve(row);
                    }
                );
            });

            request.latest_logistics = latestLogistics || null;
        }

        res.json({
            message: 'Support requests retrieved successfully',
            data: supportRequests
        });

    } catch (error) {
        console.error('Error fetching support requests:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get user's help requests
router.get('/help-requests', verifyToken, checkRole('user'), async (req, res) => {
    const db = req.db;
    const userRefId = req.user.ref_id;

    try {
        const helpRequests = await new Promise((resolve, reject) => {
            db.all(
                `SELECT hr.*, COUNT(DISTINCT sr.id) as support_request_count
                 FROM help_requests hr
                 LEFT JOIN support_requests sr ON sr.help_request_id = hr.id
                 WHERE hr.user_ref_id = ?
                 GROUP BY hr.id
                 ORDER BY hr.created_timestamp DESC`,
                [userRefId],
                (err, rows) => {
                    if (err) reject(err);
                    resolve(rows);
                }
            );
        });

        // Get items for each help request
        for (let request of helpRequests) {
            request.items = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT *
                     FROM request_items
                     WHERE help_request_id = ?`,
                    [request.id],
                    (err, rows) => {
                        if (err) reject(err);
                        resolve(rows);
                    }
                );
            });
        }

        res.json({
            message: 'Help requests retrieved successfully',
            data: helpRequests
        });

    } catch (error) {
        console.error('Error fetching help requests:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;

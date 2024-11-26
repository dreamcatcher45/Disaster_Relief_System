const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');

router.post('/help-requests', verifyToken, checkRole(['user', 'moderator', 'admin']), (req, res) => {
    const { title, description, address, items } = req.body;
    const user_ref_id = req.user.ref_id;

    if (!title || !description || !address || !items || !Array.isArray(items)) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    req.db.serialize(() => {
        req.db.run('BEGIN TRANSACTION');

        req.db.run(
            'INSERT INTO help_requests (title, description, address, user_ref_id) VALUES (?, ?, ?, ?)',
            [title, description, address, user_ref_id],
            function(err) {
                if (err) {
                    req.db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }

                const help_request_id = this.lastID;
                const itemsStatement = req.db.prepare(
                    'INSERT INTO request_items (help_request_id, name, qty, need_qty) VALUES (?, ?, ?, ?)'
                );

                try {
                    items.forEach(item => {
                        itemsStatement.run(help_request_id, item.name, item.qty, item.need_qty);
                    });
                    itemsStatement.finalize();
                    req.db.run('COMMIT');
                    res.status(201).json({ 
                        message: 'Help request created successfully', 
                        id: help_request_id 
                    });
                } catch (error) {
                    req.db.run('ROLLBACK');
                    res.status(500).json({ error: error.message });
                }
            }
        );
    });
});

// List support requests (Moderator/Admin)
router.get('/support-requests', verifyToken, checkRole(['moderator', 'admin']), async (req, res) => {
    const db = req.db;
    const { status, help_request_id } = req.query;

    try {
        let query = `
            SELECT sr.*, hr.title as help_request_title, u.name as requester_name
            FROM support_requests sr
            JOIN help_requests hr ON hr.id = sr.help_request_id
            JOIN user_refs ur ON ur.ref_id = sr.user_ref_id
            JOIN users u ON u.id = ur.user_id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ' AND sr.status = ?';
            params.push(status);
        }

        if (help_request_id) {
            query += ' AND sr.help_request_id = ?';
            params.push(help_request_id);
        }

        query += ' ORDER BY sr.created_at DESC';

        const supportRequests = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
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

// Review support request (Moderator/Admin)
router.post('/support-requests/:id/review', verifyToken, checkRole(['moderator', 'admin']), async (req, res) => {
    const db = req.db;
    const { id } = req.params;
    const { action, notes } = req.body;
    const handlerRefId = req.user.ref_id;

    if (!['accept', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action. Must be "accept" or "reject"' });
    }

    try {
        // Start transaction
        await new Promise((resolve, reject) => {
            db.run('BEGIN TRANSACTION', err => {
                if (err) reject(err);
                resolve();
            });
        });

        try {
            // Get support request
            const supportRequest = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT sr.*, hr.status as help_request_status
                     FROM support_requests sr
                     JOIN help_requests hr ON hr.id = sr.help_request_id
                     WHERE sr.id = ?`,
                    [id],
                    (err, row) => {
                        if (err) reject(err);
                        resolve(row);
                    }
                );
            });

            if (!supportRequest) {
                throw new Error('Support request not found');
            }

            if (supportRequest.status !== 'pending') {
                throw new Error('Support request has already been reviewed');
            }

            if (supportRequest.help_request_status !== 'active') {
                throw new Error('Help request is no longer active');
            }

            const newStatus = action === 'accept' ? 'accepted' : 'rejected';

            // Update support request status
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE support_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [newStatus, id],
                    err => {
                        if (err) reject(err);
                        resolve();
                    }
                );
            });

            if (action === 'accept') {
                // Update help request items quantities
                const items = await new Promise((resolve, reject) => {
                    db.all(
                        'SELECT * FROM support_request_items WHERE support_request_id = ?',
                        [id],
                        (err, rows) => {
                            if (err) reject(err);
                            resolve(rows);
                        }
                    );
                });

                for (const item of items) {
                    await new Promise((resolve, reject) => {
                        db.run(
                            `UPDATE request_items 
                             SET received_qty = received_qty + ?,
                                 need_qty = need_qty - ?
                             WHERE id = ?`,
                            [item.quantity_offered, item.quantity_offered, item.request_item_id],
                            err => {
                                if (err) reject(err);
                                resolve();
                            }
                        );
                    });
                }

                // Check if all items have need_qty = 0
                const remainingNeeds = await new Promise((resolve, reject) => {
                    db.get(
                        `SELECT COUNT(*) as count
                         FROM request_items
                         WHERE help_request_id = ? AND need_qty > 0`,
                        [supportRequest.help_request_id],
                        (err, row) => {
                            if (err) reject(err);
                            resolve(row);
                        }
                    );
                });

                // If all needs are met, update help request status to completed
                if (remainingNeeds.count === 0) {
                    await new Promise((resolve, reject) => {
                        db.run(
                            'UPDATE help_requests SET status = ? WHERE id = ?',
                            ['completed', supportRequest.help_request_id],
                            err => {
                                if (err) reject(err);
                                resolve();
                            }
                        );
                    });
                }

                // Create initial logistics tracking entry
                await new Promise((resolve, reject) => {
                    db.run(
                        `INSERT INTO logistics_tracking 
                         (support_request_id, previous_status, new_status, handler_ref_id, notes)
                         VALUES (?, ?, ?, ?, ?)`,
                        [id, 'pending', 'accepted', handlerRefId, notes],
                        err => {
                            if (err) reject(err);
                            resolve();
                        }
                    );
                });

                // Update help request logistic_status
                await new Promise((resolve, reject) => {
                    db.run(
                        'UPDATE help_requests SET logistic_status = ? WHERE id = ?',
                        ['accepted', supportRequest.help_request_id],
                        err => {
                            if (err) reject(err);
                            resolve();
                        }
                    );
                });
            }

            await new Promise((resolve, reject) => {
                db.run('COMMIT', err => {
                    if (err) reject(err);
                    resolve();
                });
            });

            res.json({
                message: `Support request ${action}ed successfully`,
                data: {
                    support_request_id: id,
                    status: newStatus,
                    updated_at: new Date().toISOString()
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
        console.error('Error reviewing support request:', error);
        res.status(error.message.includes('not found') ? 404 : 400).json({ 
            message: error.message || 'Internal server error' 
        });
    }
});

// Update logistics status (Moderator/Admin)
router.post('/logistics/:id/status', verifyToken, checkRole(['moderator', 'admin']), async (req, res) => {
    const db = req.db;
    const { id } = req.params;
    const { new_status, notes } = req.body;
    const handlerRefId = req.user.ref_id;

    const validStatusTransitions = {
        'accepted': ['received'],
        'received': ['delivered'],
        'delivered': ['completed']
    };

    try {
        // Start transaction
        await new Promise((resolve, reject) => {
            db.run('BEGIN TRANSACTION', err => {
                if (err) reject(err);
                resolve();
            });
        });

        try {
            // Get support request with current status
            const supportRequest = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT sr.*, hr.logistic_status as current_status
                     FROM support_requests sr
                     JOIN help_requests hr ON hr.id = sr.help_request_id
                     WHERE sr.id = ? AND sr.status = 'accepted'`,
                    [id],
                    (err, row) => {
                        if (err) reject(err);
                        resolve(row);
                    }
                );
            });

            if (!supportRequest) {
                throw new Error('Support request not found or not accepted');
            }

            const currentStatus = supportRequest.current_status;

            // Validate status transition
            if (!validStatusTransitions[currentStatus]?.includes(new_status)) {
                throw new Error(`Invalid status transition from ${currentStatus} to ${new_status}`);
            }

            // Create logistics tracking entry
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO logistics_tracking 
                     (support_request_id, previous_status, new_status, handler_ref_id, notes)
                     VALUES (?, ?, ?, ?, ?)`,
                    [id, currentStatus, new_status, handlerRefId, notes],
                    err => {
                        if (err) reject(err);
                        resolve();
                    }
                );
            });

            // Update help request status
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE help_requests SET logistic_status = ? WHERE id = ?',
                    [new_status, supportRequest.help_request_id],
                    err => {
                        if (err) reject(err);
                        resolve();
                    }
                );
            });

            // If status is completed, update support request status
            if (new_status === 'completed') {
                await new Promise((resolve, reject) => {
                    db.run(
                        'UPDATE support_requests SET status = ? WHERE id = ?',
                        ['completed', id],
                        err => {
                            if (err) reject(err);
                            resolve();
                        }
                    );
                });
            }

            await new Promise((resolve, reject) => {
                db.run('COMMIT', err => {
                    if (err) reject(err);
                    resolve();
                });
            });

            res.json({
                message: 'Logistics status updated successfully',
                data: {
                    support_request_id: id,
                    previous_status: currentStatus,
                    new_status,
                    timestamp: new Date().toISOString()
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
        console.error('Error updating logistics status:', error);
        res.status(error.message.includes('not found') ? 404 : 400).json({ 
            message: error.message || 'Internal server error' 
        });
    }
});

// Get logistics history (Moderator/Admin)
router.get('/logistics/history', verifyToken, checkRole(['moderator', 'admin']), async (req, res) => {
    const db = req.db;
    const { support_request_id, status, start_date, end_date } = req.query;

    try {
        let query = `
            SELECT lt.*, hr.title as help_request_title,
                   u1.name as handler_name, u1.role as handler_role,
                   u2.name as requester_name
            FROM logistics_tracking lt
            JOIN support_requests sr ON sr.id = lt.support_request_id
            JOIN help_requests hr ON hr.id = sr.help_request_id
            JOIN user_refs ur1 ON ur1.ref_id = lt.handler_ref_id
            JOIN users u1 ON u1.id = ur1.user_id
            JOIN user_refs ur2 ON ur2.ref_id = sr.user_ref_id
            JOIN users u2 ON u2.id = ur2.user_id
            WHERE 1=1
        `;
        const params = [];

        if (support_request_id) {
            query += ' AND lt.support_request_id = ?';
            params.push(support_request_id);
        }

        if (status) {
            query += ' AND lt.new_status = ?';
            params.push(status);
        }

        if (start_date) {
            query += ' AND lt.timestamp >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND lt.timestamp <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY lt.timestamp DESC';

        const history = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });

        res.json({
            message: 'Logistics history retrieved successfully',
            data: history
        });

    } catch (error) {
        console.error('Error fetching logistics history:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;

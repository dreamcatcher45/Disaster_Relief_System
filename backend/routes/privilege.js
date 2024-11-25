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

module.exports = router;

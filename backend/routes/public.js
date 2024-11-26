const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./disaster_relief.db');

router.get('/help-requests', (req, res) => {
    const query = `
        SELECT 
            hr.*,
            json_group_array(
                json_object(
                    'request_item_id', ri.id,
                    'name', ri.name,
                    'qty', ri.qty,
                    'received_qty', ri.received_qty,
                    'need_qty', ri.need_qty
                )
            ) as items_list
        FROM help_requests hr
        LEFT JOIN request_items ri ON hr.id = ri.help_request_id
        GROUP BY hr.id
        ORDER BY hr.created_timestamp DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        // Parse the JSON string of items_list for each row
        rows.forEach(row => {
            if (row.items_list) {
                try {
                    row.items_list = JSON.parse(row.items_list);
                    // Filter out null items that might come from LEFT JOIN
                    row.items_list = row.items_list.filter(item => item.request_item_id !== null);
                } catch (e) {
                    console.error('Error parsing items_list:', e);
                    row.items_list = [];
                }
            } else {
                row.items_list = [];
            }
        });

        res.json(rows);
    });
});

module.exports = router;

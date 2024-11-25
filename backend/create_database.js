require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const db = new sqlite3.Database(process.env.DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        return;
    }
    console.log('Connected to SQLite database');
});

// Run queries in sequence using promises
const runQuery = (query) => {
    return new Promise((resolve, reject) => {
        db.run(query, (err) => {
            if (err) {
                console.error('Error running query:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

const initializeDatabase = async () => {
    try {
        // Create User References table
        await runQuery(`CREATE TABLE IF NOT EXISTS user_refs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ref_id TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('User references table created');

        // Create Users table with ref_id
        await runQuery(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ref_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone_number TEXT UNIQUE NOT NULL,
            address TEXT,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(ref_id) REFERENCES user_refs(ref_id)
        )`);
        console.log('Users table created');

        // Create API Logs table
        await runQuery(`CREATE TABLE IF NOT EXISTS api_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_ref_id TEXT,
            action TEXT NOT NULL,
            jwt_token TEXT,
            role TEXT,
            api_url TEXT NOT NULL,
            method TEXT NOT NULL,
            request_body TEXT,
            response_status INTEGER,
            response_body TEXT,
            ip_address TEXT,
            user_agent TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_ref_id) REFERENCES user_refs(ref_id)
        )`);
        console.log('API Logs table created');

        // Create Help Requests table
        await runQuery(`CREATE TABLE IF NOT EXISTS help_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            address TEXT NOT NULL,
            status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed')),
            created_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            priority TEXT DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
            logistic_status TEXT DEFAULT 'pending' CHECK(logistic_status IN ('pending', 'accepted', 'received', 'delivered', 'completed')),
            user_ref_id TEXT,
            FOREIGN KEY(user_ref_id) REFERENCES user_refs(ref_id)
        )`);
        console.log('Help requests table created');

        // Create Items table for help requests
        await runQuery(`CREATE TABLE IF NOT EXISTS request_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            help_request_id INTEGER,
            name TEXT NOT NULL,
            qty INTEGER NOT NULL,
            received_qty INTEGER DEFAULT 0,
            need_qty INTEGER NOT NULL,
            FOREIGN KEY(help_request_id) REFERENCES help_requests(id)
        )`);
        console.log('Request items table created');

        // Create Support Requests table
        await runQuery(`CREATE TABLE IF NOT EXISTS support_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            help_request_id INTEGER NOT NULL,
            user_ref_id TEXT NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'completed')),
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(help_request_id) REFERENCES help_requests(id),
            FOREIGN KEY(user_ref_id) REFERENCES user_refs(ref_id)
        )`);
        console.log('Support requests table created');

        // Create Support Request Items table
        await runQuery(`CREATE TABLE IF NOT EXISTS support_request_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            support_request_id INTEGER NOT NULL,
            request_item_id INTEGER NOT NULL,
            quantity_offered INTEGER NOT NULL,
            notes TEXT,
            FOREIGN KEY(support_request_id) REFERENCES support_requests(id),
            FOREIGN KEY(request_item_id) REFERENCES request_items(id)
        )`);
        console.log('Support request items table created');

        // Create Logistics Tracking table
        await runQuery(`CREATE TABLE IF NOT EXISTS logistics_tracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            support_request_id INTEGER NOT NULL,
            previous_status TEXT NOT NULL,
            new_status TEXT NOT NULL,
            handler_ref_id TEXT NOT NULL,
            notes TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(support_request_id) REFERENCES support_requests(id),
            FOREIGN KEY(handler_ref_id) REFERENCES user_refs(ref_id)
        )`);
        console.log('Logistics tracking table created');

        // Create indexes
        await runQuery('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
        await runQuery('CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number)');
        await runQuery('CREATE INDEX IF NOT EXISTS idx_users_ref_id ON users(ref_id)');
        await runQuery('CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status)');
        await runQuery('CREATE INDEX IF NOT EXISTS idx_support_requests_status ON support_requests(status)');
        await runQuery('CREATE INDEX IF NOT EXISTS idx_support_requests_user ON support_requests(user_ref_id)');
        await runQuery('CREATE INDEX IF NOT EXISTS idx_logistics_support_request ON logistics_tracking(support_request_id)');
        await runQuery('CREATE INDEX IF NOT EXISTS idx_api_logs_ref_id ON api_logs(user_ref_id)');
        await runQuery('CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_logs(timestamp)');
        console.log('Indexes created');

        console.log('Database schema created successfully');
        db.close(() => {
            console.log('Database connection closed');
            process.exit(0);
        });
    } catch (error) {
        console.error('Error initializing database:', error);
        db.close(() => {
            console.error('Database connection closed due to error');
            process.exit(1);
        });
    }
};

initializeDatabase();

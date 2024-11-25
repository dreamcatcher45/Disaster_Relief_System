require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const apiLogger = require('./middleware/logger');
const jwt = require('jsonwebtoken');

console.log('Environment variables loaded:');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('- JWT_EXPIRATION:', process.env.JWT_EXPIRATION);
console.log('- DB_PATH:', process.env.DB_PATH);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = new sqlite3.Database(process.env.DB_PATH || './disaster_relief.db', (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Make db available in request object
app.use((req, res, next) => {
    req.db = db;
    next();
});

// Extract user info for logging if available
app.use(async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('[Logger Middleware] Token:', token);
    
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('[Logger Middleware] Decoded token:', decoded);
            
            // Get user from database to ensure we have role
            const user = await new Promise((resolve, reject) => {
                req.db.get(
                    `SELECT u.*, ur.ref_id 
                     FROM users u 
                     JOIN user_refs ur ON ur.user_id = u.id 
                     WHERE ur.ref_id = ?`,
                    [decoded.ref_id],
                    (err, row) => {
                        if (err) reject(err);
                        resolve(row);
                    }
                );
            });
            
            if (user) {
                req.logUser = {
                    ref_id: user.ref_id,
                    role: user.role
                };
                console.log('[Logger Middleware] Set logUser:', req.logUser);
            }
        } catch (error) {
            console.error('[Logger Middleware] Token verification error:', error);
        }
    }
    next();
});

// API Logger middleware
app.use(apiLogger);

// Routes
app.use('/api/public', require('./routes/public'));
app.use('/api/privilege', require('./routes/privilege'));
app.use('/api/user', require('./routes/user'));
app.use('/api/moderator', require('./routes/moderator'));
app.use('/api/admin', require('./routes/admin'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Close database connection on server shutdown
process.on('SIGINT', () => {
    db.close(() => {
        console.log('Database connection closed');
        process.exit(0);
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port} in ${process.env.NODE_ENV} mode`);
});

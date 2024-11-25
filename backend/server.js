require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const apiLogger = require('./middleware/logger');

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

const jwt = require('jsonwebtoken');
require('dotenv').config();
const { getUserByRefId } = require('../utils/db_utils');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION;

// Verify JWT_SECRET is loaded
if (!JWT_SECRET) {
    console.error('JWT_SECRET is not set in environment variables!');
    process.exit(1);
}

console.log('Auth middleware loaded with JWT_SECRET:', JWT_SECRET);

const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        console.log('Verifying token:', token);
        console.log('Using JWT_SECRET:', JWT_SECRET);
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Decoded token:', decoded);
        
        const user = await getUserByRefId(decoded.ref_id);
        console.log('Retrieved user:', user);
        
        if (!user) {
            console.log('No user found for ref_id:', decoded.ref_id);
            return res.status(401).json({ message: 'Invalid token.' });
        }

        req.user = user;
        req.user.ref_id = decoded.ref_id; // Attach ref_id from token
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(400).json({ message: 'Invalid token.' });
    }
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({ message: "No user found" });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        next();
    };
};

module.exports = {
    verifyToken,
    checkRole,
    JWT_SECRET,
    JWT_EXPIRATION
};

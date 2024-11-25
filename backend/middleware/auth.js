const jwt = require('jsonwebtoken');
require('dotenv').config();
const { getUserByRefId } = require('../utils/db_utils');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION;

const verifyToken = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(403).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await getUserByRefId(decoded.ref_id);
        
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
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

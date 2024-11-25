const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(process.env.DB_PATH);

// Generate an 8-digit hex reference ID
const generateRefId = () => {
    return crypto.randomBytes(4).toString('hex'); // 4 bytes = 8 hex digits
};

// Create user reference and return ref_id
const createUserRef = () => {
    return new Promise((resolve, reject) => {
        const ref_id = generateRefId();
        db.run('INSERT INTO user_refs (ref_id) VALUES (?)', [ref_id], function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    // If duplicate, try again
                    createUserRef().then(resolve).catch(reject);
                } else {
                    reject(err);
                }
            } else {
                resolve(ref_id);
            }
        });
    });
};

// Get user ID by reference ID
const getUserByRefId = (ref_id) => {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE ref_id = ?', [ref_id], (err, user) => {
            if (err) reject(err);
            else resolve(user);
        });
    });
};

// Log API activity
const logApiActivity = ({
    user_ref_id,
    action,
    jwt_token,
    role,
    api_url,
    method,
    request_body,
    response_status,
    response_body,
    ip_address,
    user_agent
}) => {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO api_logs (
                user_ref_id, action, jwt_token, role, api_url, method,
                request_body, response_status, response_body, ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            user_ref_id,
            action,
            jwt_token,
            role,
            api_url,
            method,
            request_body ? JSON.stringify(request_body) : null,
            response_status,
            response_body ? JSON.stringify(response_body) : null,
            ip_address,
            user_agent
        ];

        db.run(query, params, function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
};

// Create user with ref_id
const createUser = async (userData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const ref_id = await createUserRef();
            const query = `
                INSERT INTO users (ref_id, name, email, phone_number, address, password, role)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const params = [
                ref_id,
                userData.name,
                userData.email,
                userData.phone_number,
                userData.address,
                userData.password,
                userData.role
            ];

            db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ ...userData, ref_id, id: this.lastID });
                }
            });
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = {
    createUserRef,
    getUserByRefId,
    logApiActivity,
    createUser
};

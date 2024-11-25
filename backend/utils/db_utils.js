const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(process.env.DB_PATH);

// Generate an 8-digit hex reference ID
const generateRefId = () => {
    return crypto.randomBytes(4).toString('hex'); // 4 bytes = 8 hex digits
};

// Get user by ref_id (secure method)
const getUserByRefId = (ref_id) => {
    return new Promise((resolve, reject) => {
        console.log('Looking up user with ref_id:', ref_id);
        const query = `
            SELECT u.*, ur.ref_id 
            FROM users u
            JOIN user_refs ur ON ur.user_id = u.id
            WHERE ur.ref_id = ?`;
        
        db.get(query, [ref_id], (err, user) => {
            if (err) {
                console.error('Error in getUserByRefId:', err);
                reject(err);
            } else {
                console.log('Found user:', user);
                resolve(user);
            }
        });
    });
};

// Create user with transaction
const createUser = async (userData) => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // First create the user
            db.run(
                `INSERT INTO users (name, email, phone_number, address, password, role)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    userData.name,
                    userData.email,
                    userData.phone_number,
                    userData.address,
                    userData.password,
                    userData.role
                ],
                function(err) {
                    if (err) {
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                    }
                    
                    const userId = this.lastID;
                    const ref_id = generateRefId();

                    // Then create the ref_id and link it to the user
                    db.run(
                        'INSERT INTO user_refs (ref_id, user_id) VALUES (?, ?)',
                        [ref_id, userId],
                        (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                reject(err);
                                return;
                            }

                            db.run('COMMIT', (err) => {
                                if (err) {
                                    db.run('ROLLBACK');
                                    reject(err);
                                    return;
                                }
                                resolve({ ...userData, ref_id, id: userId });
                            });
                        }
                    );
                }
            );
        });
    });
};

// Get ref_id by user ID
const getRefIdByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT ref_id FROM user_refs WHERE user_id = ?',
            [userId],
            (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.ref_id : null);
            }
        );
    });
};

// Get user ID by ref_id
const getUserIdByRefId = (ref_id) => {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT user_id FROM user_refs WHERE ref_id = ?',
            [ref_id],
            (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.user_id : null);
            }
        );
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

module.exports = {
    createUser,
    getUserByRefId,
    getRefIdByUserId,
    getUserIdByRefId,
    logApiActivity
};

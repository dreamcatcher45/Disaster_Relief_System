const { logApiActivity } = require('../utils/db_utils');

const apiLogger = async (req, res, next) => {
    // Store the original send function
    const originalSend = res.send;
    let responseBody = null;

    // Override the send function to capture the response
    res.send = function(body) {
        responseBody = body;
        return originalSend.apply(res, arguments);
    };

    // Continue with the request
    next();

    try {
        // After response is sent, log the activity
        await logApiActivity({
            user_ref_id: req.user?.ref_id,
            action: `${req.method} ${req.path}`,
            jwt_token: req.headers['authorization']?.split(' ')[1],
            role: req.user?.role,
            api_url: req.originalUrl,
            method: req.method,
            request_body: req.body,
            response_status: res.statusCode,
            response_body: responseBody,
            ip_address: req.ip,
            user_agent: req.get('user-agent')
        });
    } catch (error) {
        console.error('Error logging API activity:', error);
    }
};

module.exports = apiLogger;

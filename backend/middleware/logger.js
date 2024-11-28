const { logApiActivity } = require('../utils/db_utils');

const apiLogger = async (req, res, next) => {
    // Store the original send function
    const originalSend = res.send;
    let responseBody = null;

    // Override the send function to capture the response
    res.send = function(body) {
        responseBody = body;
        // Call the original send function and store its result
        const result = originalSend.apply(res, arguments);
        
        // After response is sent, log the activity
        try {
            // Get user info from either authenticated user or decoded token
            const userRefId = req.user?.ref_id || req.logUser?.ref_id || null;
            const userRole = req.user?.role || req.logUser?.role || null;

            console.log('[API Logger] User info:', {
                fromUser: {
                    ref_id: req.user?.ref_id,
                    role: req.user?.role
                },
                fromLogUser: {
                    ref_id: req.logUser?.ref_id,
                    role: req.logUser?.role
                },
                final: {
                    userRefId,
                    userRole
                }
            });

            logApiActivity({
                user_ref_id: userRefId,
                action: `${req.method} ${req.path}`,
                jwt_token: req.headers['authorization']?.split(' ')[1],
                role: userRole,
                api_url: req.originalUrl,
                method: req.method,
                request_body: req.body,
                response_status: res.statusCode,
                response_body: responseBody
            }).catch(error => {
                console.error('[API Logger] Error logging API activity:', error);
            });
        } catch (error) {
            console.error('[API Logger] Error in logging middleware:', error);
        }

        return result;
    };

    next();
};

module.exports = apiLogger;

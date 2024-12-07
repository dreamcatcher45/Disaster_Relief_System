# Disaster Relief System API Documentation

## API Authentication
- All protected routes require a JWT token in the Authorization header
- Token format: `Bearer <token>`
- Tokens expire after 24 hours
- Each user is assigned a unique 8-digit hex reference ID
- API activities are automatically logged

## Public APIs

### View Help Requests
```bash
curl -X GET http://localhost:3000/api/public/help-requests
```

## User APIs

### Register User
```bash
curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "user21@example.com",
    "phone_number": "1234567800",
    "address": "123 Main St",
    "password": "userpass123"
  }'
```

### Login User
```bash
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "1234567800",
    "password": "userpass123"
  }'
```

## Admin APIs

### Register First Admin (One-time only)
```bash
curl -X POST http://localhost:3000/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin1@example.com",
    "phone_number": "9876543210",
    "address": "456 Admin St",
    "password": "adminpass123"
  }'
```

### Login Admin
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin1@example.com",
    "password": "adminpass123"
  }'
```

### Create Moderator (Admin Only)
```bash
curl -X POST http://localhost:3000/api/admin/create-moderator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "name": "Moderator User",
    "email": "mod1@example.com",
    "phone_number": "5555555555",
    "address": "789 Mod St",
    "password": "modpass123"
  }'
```

### List Users (Admin Only)
```bash
# List all users
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <admin_token>"

# Filter by role (user/moderator)
curl -X GET http://localhost:3000/api/admin/users?role=moderator \
  -H "Authorization: Bearer <admin_token>"
```

### Get All Users (Admin Only)
```bash
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <admin_token>"
```
Query parameters:
- `role`: Filter users by role (optional, values: 'user', 'moderator', 'admin')

### Delete User (Admin Only)
**DELETE** `/api/admin/users/:ref_id`

Delete a user from the system. Cannot delete admin accounts or your own account.

**Parameters:**
- `ref_id` (path parameter) - Reference ID of the user to delete



**Error Responses:**
- `400` - Cannot delete your own account
- `403` - Cannot delete admin accounts
- `404` - User not found
- `500` - Server error

### Update User Role (Admin Only)
```bash
curl -X PUT http://localhost:3000/api/admin/users/<ref_id>/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "new_role": "moderator"
  }'
```
Note: Cannot modify admin roles or change own role.

### Change User Role (Admin Only)
```bash
curl -X PUT http://localhost:3000/api/admin/users/1a2b3c4d/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "new_role": "moderator"
  }'
```

## Moderator APIs

### Login Moderator
```bash
curl -X POST http://localhost:3000/api/moderator/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mod1@example.com",
    "password": "modpass123"
  }'
```

## Privileged APIs (Requires Authentication)

### Create Help Request
```bash
curl -X POST http://localhost:3000/api/privilege/help-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Need Medical Supplies",
    "description": "Urgent need for first aid kits and medications",
    "address": "321 Emergency St",
    "priority": "high",
    "items": [
      {
        "name": "First Aid Kit",
        "qty": 10,
        "need_qty": 10
      },
      {
        "name": "Pain Medication",
        "qty": 50,
        "need_qty": 50
      }
    ]
  }'
```

## Support and Logistics APIs

### Create Support Request (User Only)
```bash
curl -X POST http://localhost:3000/api/user/support-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "help_request_id": 1,
    "items": [
      {
        "request_item_id": 1,
        "quantity_offered": 5,
        "notes": "Can deliver by tomorrow"
      },
      {
        "request_item_id": 2,
        "quantity_offered": 10,
        "notes": "Available immediately"
      }
    ],
    "notes": "I can help with these items"
  }'
```

### View User's Help Requests
```bash
curl -X GET http://localhost:3000/api/user/help-requests \
  -H "Authorization: Bearer <token>"
```

### View User's Support Requests
```bash
curl -X GET http://localhost:3000/api/user/support-requests \
  -H "Authorization: Bearer <token>"
```

### Get Support Requests (Moderator/Admin)
```bash
curl -X GET http://localhost:3000/api/privilege/support-requests \
  -H "Authorization: Bearer <token>"
```
Query parameters:
- `status`: Filter by status (optional)
- `help_request_id`: Filter by help request ID (optional)

### List Support Requests (Moderator/Admin)
```bash
curl -X GET http://localhost:3000/api/privilege/support-requests \
  -H "Authorization: Bearer <token>" \
  -G \
  -d status=pending \
  -d help_request_id=1
```

### Review Support Request (Moderator/Admin)
```bash
curl -X POST http://localhost:3000/api/privilege/support-requests/<id>/review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "action": "accept",
    "notes": "Support request accepted"
  }'
```
Action values: 'accept' or 'reject'

### Review Support Request (Moderator/Admin)
```bash
curl -X POST http://localhost:3000/api/privilege/support-requests/1/review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "action": "accept",
    "notes": "Approved after verification",
    "items": [
      {
        "request_item_id": 1,
        "quantity_offered": 5
      }
    ]
  }'
```

Notes:
- When a support request is approved:
  1. The `received_qty` of each item is increased by the `quantity_offered`
  2. The `need_qty` of each item is decreased by the `quantity_offered`
  3. If all items in the help request have `need_qty = 0`, the help request status is automatically updated to "completed"
- No quantity changes occur if the request is rejected

### Update Logistics Status (Moderator/Admin)
```bash
curl -X POST http://localhost:3000/api/privilege/logistics/<id>/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "new_status": "received",
    "notes": "Items received at collection center"
  }'
```

### Update Logistics Status (Moderator/Admin)
```bash
curl -X POST http://localhost:3000/api/privilege/logistics/1/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "new_status": "received",
    "notes": "Items received at warehouse"
  }'
```
Valid status transitions:
- 'accepted' → 'received'
- 'received' → 'delivered'
- 'delivered' → 'completed'

### Get Logistics History (Moderator/Admin)
```bash
curl -X GET http://localhost:3000/api/privilege/logistics/history \
  -H "Authorization: Bearer <token>"
```
Query parameters:
- `support_request_id`: Filter by support request ID (optional)
- `status`: Filter by status (optional)
- `start_date`: Filter by start date (optional)
- `end_date`: Filter by end date (optional)

## API Logging
All API requests are automatically logged with the following information:
- User reference ID (8-digit hex)
- Action performed
- API endpoint and method
- Request details
- Response status
- Timestamp
- Client information (IP, User Agent)

## Admin APIs

### View API Logs (Admin Only)
```bash
curl -X GET http://localhost:3000/api/admin/logs \
  -H "Authorization: Bearer <admin_token>" \
  -G \
  -d start_date="2024-01-01" \
  -d end_date="2024-12-31" \
  -d user_ref_id="1a2b3c4d" \
  -d action="login" \
  -d method="POST"
```

Query parameters (all optional):
- `start_date`: Filter logs from this date
- `end_date`: Filter logs until this date
- `user_ref_id`: Filter by specific user
- `action`: Filter by action type
- `method`: Filter by HTTP method

Response includes:
- User information (name, role)
- Action performed
- API endpoint details
- Request/response information
- Timestamp

Note: Results are limited to 100 most recent entries

## Notes
1. Each user gets a unique 8-digit hex reference ID upon registration
2. All authentication tokens contain the user's ref_id instead of numeric ID
3. First admin registration is only available if no admin exists
4. Only admins can create moderator accounts
5. All phone numbers must be unique
6. All email addresses must be unique
7. Passwords are securely hashed before storage
8. Tokens expire after 24 hours

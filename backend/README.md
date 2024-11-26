# Disaster Relief System - Backend

A Node.js backend service for managing disaster relief operations, coordinating help requests, and tracking support logistics.

## System Overview

- **Authentication**: JWT-based with role-specific access control
- **Database**: SQLite3 for data persistence
- **Role System**: Three-tier (User, Moderator, Admin)
- **Reference IDs**: 8-digit hex identifiers for users
- **Logging**: Automatic request logging with user tracking

## Core Components

### Help Requests
- Creation and management of disaster relief requests
- Item-based tracking system
- Status lifecycle management

### Support System
- Support request processing
- Logistics tracking
- Multi-stage approval process

### User Management
- Role-based access control
- Secure authentication
- User activity tracking

## API Endpoints

### Public APIs
- `GET /public/help-requests`: View active help requests

### User APIs
- `POST /user/register`: New user registration
- `POST /user/login`: User authentication
- `POST /user/support-requests`: Create support offer
- `GET /user/help-requests`: View user's help requests

### Moderator APIs
- `POST /moderator/login`: Moderator authentication
- `GET /privilege/support-requests`: View pending support
- `POST /privilege/support-requests/:id/review`: Process support requests
- `POST /privilege/logistics/:id/status`: Update logistics status
- `GET /privilege/logistics/history`: Track logistics changes

### Admin APIs

The following endpoints are only accessible to users with the admin role:

1. **User Management**
   - `POST /api/admin/create-moderator` - Create a new moderator account
   - `GET /api/admin/users` - List all users (with optional role filter)
   - `PUT /api/admin/users/:ref_id/role` - Update a user's role
   - `DELETE /api/admin/users/:ref_id` - Delete a user (cannot delete admins or self)

2. **System Monitoring**
   - `GET /api/admin/logs` - View system API logs with filtering options
     - Filter by date range, user, action, and method
     - Limited to 100 most recent entries

### Available Endpoints

- `POST /admin/register`: First admin setup
- `POST /admin/login`: Admin authentication
- `GET /admin/users`: User management
- `PUT /admin/users/:ref_id/role`: Role management
- `POST /admin/create-moderator`: Moderator creation
- `DELETE /admin/users/:ref_id`: Delete a user (cannot delete admins or self)
- `GET /admin/logs`: View system activity logs

## Setup

1. Install dependencies:
```bash
npm install
```

2. Initialize database:
```bash
node create_database.js
```

3. Start server:
```bash
node server.js
```

## Environment Variables
Create `.env` file with:
```
PORT=3000
JWT_SECRET=your_secret_key
JWT_EXPIRATION=24h
```

For detailed API documentation, refer to `api.md`.

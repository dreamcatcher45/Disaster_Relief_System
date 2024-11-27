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
- `POST /admin/register`: First admin setup
- `POST /admin/login`: Admin authentication
- `GET /admin/users`: User management
- `PUT /admin/users/:ref_id/role`: Role management
- `POST /admin/create-moderator`: Moderator creation
- `GET /admin/logs`: View system activity logs

## Default User Credentials

The system comes with three pre-configured users for testing purposes:

### Admin User
- Email: admin@drs.com
- Phone: +1234567890
- Password: Admin@123
- Role: Admin

> You can create user using the signup form and moderatror using the create moderator form in the admin dashboard


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

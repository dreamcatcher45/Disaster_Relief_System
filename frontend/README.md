# DRS Frontend

A web application for managing disaster response operations.

## Users and Features

### Admin
- Manage all users in the system
- View system logs and activities
- Access to all system features
- Monitor user activities and requests

### Moderator
- Review and manage help requests
- Coordinate with support teams
- Update request statuses
- View system logs

### Regular User
- Submit help requests
- Track request status
- Update personal information
- View request history

## Security Features

### Authentication
- JWT (JSON Web Token) based authentication
- Secure token storage in cookies
- Token refresh mechanism
- Protected routes and API endpoints

### Access Control
- Role-Based Access Control (RBAC)
- Three distinct user roles (Admin, Moderator, User)
- Route protection based on user roles
- API endpoint authorization

### Logging and Monitoring
- User action logging
- Login attempt tracking
- System error logging
- Activity timestamps

## Technology Stack

- **React 18** - A JavaScript library for building user interfaces
- **Vite** - Next Generation Frontend Tooling
- **Chakra UI** - A simple, modular and accessible component library
- **React Router** - For application routing
- **React Query** - For efficient server state management
- **Axios** - Promise based HTTP client


## Getting Started

### Installation

1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy `.env.example` to `.env` and configure environment variables:
   ```bash
   cp .env.example .env
   ```

## Development

The application uses:
- ESLint for code quality
- Chakra UI for component styling
- React Router for navigation
- React Query for data fetching and caching
- JWT for authentication

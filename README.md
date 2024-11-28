# Disaster Relief System (DRS)

The Disaster Relief System (DRS) is a web-based platform designed to manage help requests and coordinate support during disaster relief operations. Built with Node.js and Express.js for the backend and React with Chakra UI for the frontend, the system enables users to submit help requests, track support offers, and manage resource distribution through a structured workflow. The application implements role-based access control (RBAC) with JWT authentication and secure cookie management, ensuring secure access to sensitive operational data.

The system utilizes SQLite for data persistence with comprehensive transaction support, and features detailed API activity logging through a custom middleware that tracks all system operations, user actions, and API requests. Key functionalities include help request management, support request coordination, logistics status tracking, and role-based access management. The entire application is containerized using Docker for consistent deployment across environments, with automated database initialization and environment configuration management.

## Running the Application

Start the application:
```bash
# Using Docker
docker-compose up -d

# Using Podman
podman-compose up -d
```

The application will be available at:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000

## Admin credentials
```
email: admin@drs.com
password: Admin@123
````

## Stopping the Application

```bash
# Using Docker
docker-compose down

# Using Podman
podman-compose down
```

## Database

The SQLite database file is persisted using Docker volumes. The database file is located at `./backend/disaster_relief.db`.


# Disaster Relief System (DRS)

A comprehensive system for managing disaster relief operations.

## Prerequisites

- Docker (or Podman)
- Docker Compose (or Podman Compose)

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

## Stopping the Application

```bash
# Using Docker
docker-compose down

# Using Podman
podman-compose down
```

## Database

The SQLite database file is persisted using Docker volumes. The database file is located at `./backend/disaster_relief.db`.

# Use Node.js LTS version as the base image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create .env file from example if it doesn't exist
RUN cp -n .env.example .env || true

# Create the SQLite database
RUN npm run create-db

# Set environment variables
ENV PORT=3000
ENV DB_PATH=./disaster_relief.db
ENV SALT_ROUNDS=10
ENV JWT_SECRET=change-this-in-production

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]

# Build stage
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create a default nginx configuration
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Create script to replace environment variables
RUN echo "window.env = { \
    VITE_API_URL: '${VITE_API_URL}', \
    VITE_JWT_KEY: '${VITE_JWT_KEY}' \
};" > /usr/share/nginx/html/env-config.js

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage with Node.js (for serve)
FROM node:18-alpine
WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy build output
COPY --from=build /app/dist ./dist

# Expose port
EXPOSE 3001

# Start serve
CMD ["serve", "-s", "dist", "-l", "3001"]

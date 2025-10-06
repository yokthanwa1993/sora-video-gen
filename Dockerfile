# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --production

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server code
COPY server ./server

# Expose port
EXPOSE 8787

# Start server
CMD ["node", "server/index.js"]

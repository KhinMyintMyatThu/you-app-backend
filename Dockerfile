# # Build stage for Node.js app
# FROM node:22.9.0-alpine as node-builder

# # Set the working directory
# WORKDIR /usr/src/app

# # Copy package.json and package-lock.json
# COPY package*.json ./

# # Install dependencies
# RUN npm install --legacy-peer-deps

# # Copy application files, including tsconfig.json
# COPY . .

# # Build the application
# RUN npm run build

# # Production stage
# FROM node:22.9.0-alpine

# # Set the working directory
# WORKDIR /usr/src/app

# # Copy built application and config files from the builder stage
# COPY --from=node-builder /usr/src/app/dist ./dist
# COPY --from=node-builder /usr/src/app/package*.json ./
# COPY --from=node-builder /usr/src/app/tsconfig.json ./

# # Install production dependencies
# RUN npm install --legacy-peer-deps

# # Expose the application port
# EXPOSE 3000

# # Default command to start the application
# CMD ["npm", "run", "start:dev"]



# Step 1: Build the Node.js application
FROM node:22.9.0-alpine as node-builder

# Step 2: Set the working directory
WORKDIR /usr/src/app

# Step 3: Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Step 4: Copy the rest of the application files
COPY . .

# Step 5: Install NestJS CLI globally and build the application
RUN npm install -g @nestjs/cli --legacy-peer-deps
RUN npm run build

# Step 6: Use RabbitMQ image as a base for RabbitMQ service
FROM rabbitmq:3-management as rabbitmq

# Expose the RabbitMQ port
EXPOSE 5672

# Step 7: Combine Node.js application and RabbitMQ
FROM node:22.9.0-alpine

# Set the working directory for the application
WORKDIR /usr/src/app

# Copy built application from the node-builder stage
COPY --from=node-builder /usr/src/app/dist ./dist
COPY --from=node-builder /usr/src/app/package*.json ./

# Install production dependencies only
RUN npm install --legacy-peer-deps

# Step 4: Copy the rest of the application files
COPY . .

# Expose the application and RabbitMQ ports
EXPOSE 3000 5672

# Default command to start the NestJS application
CMD ["npm", "run", "start:dev"]

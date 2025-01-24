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

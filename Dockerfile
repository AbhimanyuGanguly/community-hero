FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bundle app source
COPY . .

# Ensure data directory exists with correct permissions for SQLite
RUN mkdir -p server/data && chown -R node:node server/data

# Use non-root user for security
USER node

# Expose port
EXPOSE 3000

# Start server
CMD [ "npm", "start" ]

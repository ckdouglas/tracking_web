# # Use the latest LTS version of Node.js
# FROM node:22
 
# # Set the working directory inside the container
# WORKDIR /app
 
# # Copy package.json and package-lock.json
# COPY package*.json ./
 
# # Install dependencies (ignore peer conflicts)
# RUN npm install --legacy-peer-deps
 
# # Copy the rest of your application files
# COPY . .
 
# # Expose the port your app runs on
# EXPOSE 3000
 
# # Define the command to run your app
# CMD ["npm", "start"]



# ---- Build Stage ----
FROM node:22 AS build

WORKDIR /app

# Copy package.json + lock file
COPY package*.json ./

# Install dependencies (ignore peer conflicts)
RUN npm install --legacy-peer-deps

# Copy source and build React
COPY . .
RUN npm run build

# ---- Production Stage ----
FROM nginx:alpine

# Copy build output to Nginx web root
COPY --from=build /app/build /usr/share/nginx/html

# Expose Nginx default port
EXPOSE 3000

# Run Nginx
CMD ["nginx", "-g", "daemon off;"]


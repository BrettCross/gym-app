# Stage 1: Build React App
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Server
FROM nginx:stable-alpine
# Copy your custom config to the Nginx configuration directory
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy the built site from the build stage
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

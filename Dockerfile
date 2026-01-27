# Stage 1: Build Frontend
FROM node:18-alpine as frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY frontend/ .

# Build frontend
RUN npm run build

# Stage 2: Static Runtime
FROM nginx:alpine

RUN sed -i 's/listen\s\+80;/listen 7860;/' /etc/nginx/conf.d/default.conf

COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 7860

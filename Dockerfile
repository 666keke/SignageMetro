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

# Stage 2: Runtime
FROM python:3.11-slim

# Install system dependencies for CairoSVG
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libcairo2-dev \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy project definition
COPY pyproject.toml .
COPY README.md .

# Install Python dependencies
# We install directly from pyproject.toml
RUN pip install --no-cache-dir .

# Copy application code
COPY app/ app/

# Copy frontend build from builder stage
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Create necessary directories for runtime data
RUN mkdir -p projects exports

# Set permissions for Hugging Face Spaces (runs as user 1000)
RUN chown -R 1000:1000 /app
RUN chmod -R 777 projects exports

# Switch to non-root user (optional but recommended for HF Spaces)
USER 1000

# Expose the port Hugging Face Spaces expects
EXPOSE 7860

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]

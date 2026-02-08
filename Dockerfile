# Use Python as base
FROM python:3.12-slim

# Install basic system tools and Node.js in one layer to save space and avoid update issues
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files first for better caching
COPY requirements.txt package.json package-lock.json* ./

# Install Python & Node dependencies
RUN pip install --no-cache-dir -r requirements.txt \
    && npm install --production

# IMPORTANT: Install Playwright and let IT handle all OS dependencies automatically
RUN npx playwright install chromium \
    && npx playwright install-deps chromium

# Copy the rest of the application
COPY . .

# Copy the rest of the application
COPY . .

# Ensure the app listens on the port Render provides
ENV PORT=10000
EXPOSE 10000

# Entry point: start the unified gateway server
CMD ["node", "render-server.js"]

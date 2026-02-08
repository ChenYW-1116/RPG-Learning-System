# Use Python as base (heavier dependencies like pandas/sklearn/matplotlib)
FROM python:3.12-slim

# Install Node.js
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install OS dependencies for Playwright and Matplotlib
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    librandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy and install Node dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Install Playwright browsers (chromium only to save space)
RUN npx playwright install chromium --with-deps

# Copy the rest of the application
COPY . .

# Ensure the app listens on the port Render provides
ENV PORT=10000
EXPOSE 10000

# Entry point: start the unified gateway server
CMD ["node", "render-server.js"]

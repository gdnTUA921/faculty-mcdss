FROM python:3.12-slim

# System dependencies for psycopg2 and spaCy
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer cache optimization)
COPY requirements.txt .
RUN pip install --no-cache-dir --prefer-binary -r requirements.txt

# Download spaCy English model
RUN python -m spacy download en_core_web_sm

# Copy application code
COPY . .

EXPOSE 8001

# --reload enables hot-reload on code changes during development
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]

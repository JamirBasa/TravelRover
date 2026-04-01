FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput --clear

# Expose port
EXPOSE 8000

# Run migrations and start gunicorn
CMD python manage.py check && \
    gunicorn travelapi.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --access-logfile - --error-logfile -

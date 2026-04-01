import os
import multiprocessing

# Railway passes port through environment variable
port = os.environ.get("PORT", "8000")
bind = f"0.0.0.0:{port}"

print(f"[*] Gunicorn booting on {bind}")

# Worker configuration
# 1 worker for API-heavy agents to prevent Railway 512MB RAM limits (OOM kills)
workers = 1 
worker_class = "sync"
timeout = 120
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

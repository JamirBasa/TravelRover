import os

port = os.environ.get('PORT', '8000')
bind = f'0.0.0.0:{port}'

print(f'[*] Gunicorn booting on {bind}')

workers = 1
worker_class = 'sync'
timeout = 120
keepalive = 5

accesslog = '-'
errorlog = '-'
loglevel = 'info'

limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

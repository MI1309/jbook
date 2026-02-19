#!/bin/bash

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate

# Start server
echo "Starting server..."
# Hugging Face Spaces expects the app to bind to port 7860
exec gunicorn core.wsgi:application --bind 0.0.0.0:7860 --workers 3

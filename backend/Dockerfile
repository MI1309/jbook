# Use official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user (Hugging Face Spaces runs as ID 1000)
RUN useradd -m -u 1000 user

# Switch to non-root user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

# Install python dependencies
COPY --chown=user requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy project with correct ownership
COPY --chown=user . /app/

# Collect static files
# We set a dummy secret key just for collectstatic
RUN python manage.py collectstatic --noinput --clear

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Expose port (HF Spaces uses 7860 by default)
EXPOSE 7860

# Entrypoint script
ENTRYPOINT ["./entrypoint.sh"]

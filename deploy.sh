#!/bin/bash

# Exit on error
set -e

# Load environment variables
source backend/.env

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Collect static files
echo "Collecting static files..."
cd backend
python manage.py collectstatic --noinput
cd ..

# Deploy to AWS
echo "Deploying to AWS..."

# Deploy backend to EC2
echo "Deploying backend to EC2..."
# Replace with your EC2 instance details
# ssh -i your-key.pem ubuntu@your-ec2-instance "cd /path/to/app && git pull && source venv/bin/activate && pip install -r requirements.txt && python manage.py migrate && sudo systemctl restart gunicorn"

# Deploy frontend to S3
echo "Deploying frontend to S3..."
# Replace with your S3 bucket name
# aws s3 sync frontend/out s3://your-s3-bucket-name --delete

# Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
# Replace with your CloudFront distribution ID
# aws cloudfront create-invalidation --distribution-id your-distribution-id --paths "/*"

echo "Deployment complete!"
# Share Board

A real-time collaborative whiteboard application built with Django, Next.js, and WebSockets.

## Features

- Real-time collaborative drawing
- Room-based collaboration
- User authentication
- Responsive design
- Dark mode support

## Tech Stack

### Backend

- Django 5.0
- Django REST Framework
- Django Channels for WebSockets
- PostgreSQL
- JWT Authentication
- Pipenv for dependency management

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Socket.io Client

## Prerequisites

- Python 3.10+
- Node.js 16+
- PostgreSQL
- AWS Account (for deployment)
- Pipenv

## Local Development

### Backend Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/share-board.git
   cd share-board
   ```

2. Install dependencies using Pipenv:

   ```bash
   cd backend
   pipenv install
   ```

3. Create a `.env` file:

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your local settings.

4. Run migrations:

   ```bash
   pipenv run python manage.py migrate
   ```

5. Create a superuser:

   ```bash
   pipenv run python manage.py createsuperuser
   ```

6. Start the development server:
   ```bash
   pipenv run python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env.local` file:

   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## AWS Deployment

### Prerequisites

- AWS Account
- AWS CLI configured
- Domain name (optional)

### Deployment Steps

1. Create an EC2 instance (t2.micro for free tier)
2. Set up an RDS PostgreSQL instance (t3.micro for free tier)
3. Create an S3 bucket for static files
4. Set up CloudFront for CDN (optional)
5. Configure environment variables for production

### Backend Deployment

1. SSH into your EC2 instance
2. Clone the repository
3. Install dependencies using Pipenv
4. Configure the `.env` file with production settings
5. Set up Gunicorn and Nginx
6. Configure SSL with Let's Encrypt

### Frontend Deployment

1. Build the frontend:

   ```bash
   cd frontend
   npm run build
   ```

2. Deploy to Vercel or AWS Amplify:
   ```bash
   vercel
   ```

## Environment Variables

### Backend (.env)

```
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,your-aws-domain.com
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-aws-domain.com

# Database
DB_NAME=share_board
DB_USER=postgres
DB_PASSWORD=your-password-here
DB_HOST=localhost
DB_PORT=5432

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME=5
JWT_REFRESH_TOKEN_LIFETIME=1440

# AWS Settings (for production)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_STORAGE_BUCKET_NAME=your-s3-bucket-name
AWS_S3_REGION_NAME=us-east-1
AWS_S3_CUSTOM_DOMAIN=your-cloudfront-domain.cloudfront.net
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# For production
# NEXT_PUBLIC_API_URL=https://your-aws-domain.com/api
# NEXT_PUBLIC_WS_URL=wss://your-aws-domain.com
```

## License

MIT

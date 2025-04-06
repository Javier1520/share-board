# Share Board

A real-time collaborative platform for video conferencing, drawing, and text collaboration.

## Features

- Real-time video conferencing
- Collaborative drawing canvas
- Real-time text collaboration
- Mobile-first responsive design
- Dark mode by default
- JWT authentication
- Room-based collaboration
- WebSocket real-time communication

## Tech Stack

### Backend

- Django with Django REST Framework
- PostgreSQL
- JWT authentication
- Django Channels for WebSocket
- Python 3.10
- Pipenv for dependency management

### Frontend

- Next.js with TypeScript
- Tailwind CSS
- shadcn/ui components
- WebSocket client
- Mobile-first responsive design

## Prerequisites

- Python 3.10
- Node.js 18+
- PostgreSQL
- AWS Account (for deployment)

## Project Structure

```
share-board/
├── backend/           # Django backend
│   ├── Pipfile       # Python dependencies
│   ├── manage.py
│   └── share_board/  # Django project
└── frontend/         # Next.js frontend
    ├── package.json
    └── src/          # Source code
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   pipenv install
   ```

3. Activate the virtual environment:

   ```bash
   pipenv shell
   ```

4. Run migrations:

   ```bash
   python manage.py migrate
   ```

5. Start the development server:
   ```bash
   python manage.py runserver
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

3. Start the development server:
   ```bash
   npm run dev
   ```

## AWS Deployment

The project is configured for AWS Free Tier deployment:

1. EC2 instance for hosting
2. RDS for PostgreSQL database
3. S3 for static files
4. CloudFront for CDN (optional)

Detailed deployment instructions are available in the deployment guide.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.

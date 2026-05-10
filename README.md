# AI-Powered Job Recommendation System

A full-stack web application that provides personalized job recommendations using AI and NLP techniques. Users can upload their resumes, and the system analyzes their skills, experience, and preferences to match them with real-time job opportunities from various APIs.

## Features

- **User Authentication**: Secure JWT-based authentication
- **Resume Upload & Parsing**: Extract skills, experience, and education from PDF/DOCX resumes using NLP
- **Real-Time Job Fetching**: Integrate with JSearch, Adzuna, and JobDataLake APIs
- **AI Recommendation Engine**: Use spaCy, Sentence Transformers, and scikit-learn for intelligent matching
- **Modern UI**: Responsive React frontend with Tailwind CSS
- **Microservices Architecture**: Separate AI service using FastAPI
- **MongoDB Database**: Store user data, resumes, and job recommendations

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, Axios, React Router
- **Backend**: Node.js, Express.js
- **AI Service**: Python, FastAPI, spaCy, Sentence Transformers, scikit-learn
- **Database**: MongoDB
- **Deployment**: Vercel (Frontend), Render (Backend), MongoDB Atlas

## Project Structure

```
job-recommendation-system/
├── client/                 # React frontend
├── server/                 # Node.js backend
├── ai-service/            # Python AI microservice
├── models/                # ML models and data
├── resumes/               # Uploaded resume files
├── datasets/              # Training datasets
├── docker-compose.yml     # Docker configuration
└── README.md
```

## Installation

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- MongoDB
- Docker (optional)

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and update values as needed:
   ```bash
   cp ../.env.example .env
   ```
   Then edit `.env` to set your values, for example:
   ```env
   MONGO_URI=mongodb://localhost:27017/job-recommendation
   JWT_SECRET=your_jwt_secret
   JSEARCH_API_KEY=your_jsearch_api_key
   ADZUNA_API_KEY=your_adzuna_api_key
   JOBDATALAKE_API_KEY=your_jobdatalake_api_key
   AI_SERVICE_URL=http://localhost:8000
   ```
   If you use local MongoDB, make sure MongoDB is running before starting the server.

4. Start the server:
   ```bash
   npm start
   ```

### AI Service Setup

1. Navigate to the ai-service directory:
   ```bash
   cd ai-service
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Copy `.env.example` to `.env` and update values as needed:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` to set your values, for example:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

5. Start the AI service:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Usage

1. Register a new account or login
2. Upload your resume (PDF or DOCX)
3. View personalized job recommendations
4. Save interesting jobs
5. Explore job details and apply

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Resume Endpoints

- `POST /api/resume/upload` - Upload resume
- `GET /api/resume/:userId` - Get user's resume data

### Job Endpoints

- `GET /api/jobs/recommendations/:userId` - Get job recommendations
- `POST /api/jobs/save` - Save a job
- `GET /api/jobs/saved/:userId` - Get saved jobs

### AI Service Endpoints

- `POST /parse-resume` - Parse resume text
- `POST /recommend-jobs` - Get job recommendations

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `build`
4. Deploy

### Backend (Render)

1. Connect your GitHub repository to Render
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables
5. Deploy

> For local development, copy `.env.example` to a `.env` file in the repository root or `server/` directory and update `MONGO_URI`.

### Database (MongoDB Atlas)

1. Create a MongoDB Atlas cluster
2. Get connection string
3. Update `MONGO_URI` in environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
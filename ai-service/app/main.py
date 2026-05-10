from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import openai
import os
import json
from dotenv import load_dotenv

# Load local environment variables from ai-service/.env
load_dotenv()

app = FastAPI(title="AI Job Recommendation Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI API setup
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set")

# Data models
class ResumeParseRequest(BaseModel):
    text: str

class JobRecommendationRequest(BaseModel):
    userProfile: Dict[str, Any]
    jobs: List[Dict[str, Any]]

class Recommendation(BaseModel):
    jobId: str
    score: float
    reasons: List[str]
    skillMatches: List[str]
    experienceMatch: bool
    locationMatch: bool
    salaryMatch: bool

class RecommendationResponse(BaseModel):
    recommendations: List[Recommendation]

class CareerAdviceRequest(BaseModel):
    userProfile: Dict[str, Any]
    careerGoals: Optional[str] = None

class ResumeFeedbackRequest(BaseModel):
    resumeText: str
    jobDescription: Optional[str] = None

class InterviewPrepRequest(BaseModel):
    jobTitle: str
    userProfile: Dict[str, Any]

class CourseRecommendationRequest(BaseModel):
    userProfile: Dict[str, Any]
    targetSkills: List[str]

class CareerAdvice(BaseModel):
    advice: str
    nextSteps: List[str]
    skillGaps: List[str]

class ResumeFeedback(BaseModel):
    overallScore: int
    strengths: List[str]
    improvements: List[str]
    suggestions: List[str]

class InterviewPrep(BaseModel):
    commonQuestions: List[str]
    technicalQuestions: List[str]
    tips: List[str]
    preparationSteps: List[str]

class CourseRecommendation(BaseModel):
    courses: List[Dict[str, str]]
    learningPath: List[str]

def call_openai_api(prompt: str, max_tokens: int = 1000) -> str:
    """Call OpenAI API with a prompt"""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")

def parse_json_response(response: str) -> Dict[str, Any]:
    """Parse JSON response from OpenAI."""
    try:
        # If AI returns a JSON string directly, parse it first.
        return json.loads(response)
    except json.JSONDecodeError:
        pass

    try:
        # Remove markdown fences and surrounding text before JSON extraction.
        sanitized = response.strip()
        if sanitized.startswith('```'):
            sanitized = sanitized.strip('`').strip()

        start = sanitized.find('{')
        end = sanitized.rfind('}') + 1
        if start != -1 and end != -1 and end > start:
            json_str = sanitized[start:end]
            return json.loads(json_str)

        return {"error": "No JSON found in response"}
    except json.JSONDecodeError:
        return {"error": "Invalid JSON in response"}

# API endpoints
@app.post("/parse-resume", response_model=Dict[str, Any])
async def parse_resume(request: ResumeParseRequest):
    """Parse resume text and extract structured information using AI"""
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Resume text is required and cannot be empty")

        prompt = f"""
        Analyze the following resume text and extract key information in valid JSON format.

        Resume Text:
        {request.text}

        Please return ONLY a JSON object with the following structure, without any markdown, commentary, or extra text:
        {{
            "skills": ["list", "of", "technical", "skills"],
            "experience": ["list", "of", "experience", "items"],
            "education": ["list", "of", "education", "items"],
            "certifications": ["list", "of", "certifications"]
        }}

        Focus on technical skills, work experience, education, and certifications.
        """

        response = call_openai_api(prompt, max_tokens=1500)
        parsed_data = parse_json_response(response)
        if not parsed_data or isinstance(parsed_data, dict) and parsed_data.get('error'):
            raise HTTPException(status_code=500, detail=f"Error parsing resume: {parsed_data.get('error', 'Invalid JSON response from AI')}" )

        return parsed_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing resume: {str(e)}")

@app.post("/recommend-jobs", response_model=RecommendationResponse)
async def recommend_jobs(request: JobRecommendationRequest):
    """Generate job recommendations based on user profile using AI"""
    try:
        user_profile = request.userProfile
        jobs = request.jobs

        recommendations = []

        for job in jobs:
            prompt = f"""
            Compare the following user profile with the job description and provide a recommendation score and analysis.

            User Profile:
            {json.dumps(user_profile, indent=2)}

            Job Description:
            {json.dumps(job, indent=2)}

            Please return a JSON object with the following structure:
            {{
                "score": <number between 0-100>,
                "reasons": ["list", "of", "reasons", "for", "recommendation"],
                "skillMatches": ["list", "of", "matching", "skills"],
                "experienceMatch": <boolean>,
                "locationMatch": <boolean>,
                "salaryMatch": <boolean>
            }}

            Be realistic about the matches and provide specific reasons.
            """

            response = call_openai_api(prompt, max_tokens=1000)
            analysis = parse_json_response(response)

            recommendation = Recommendation(
                jobId=job.get('jobId', ''),
                score=float(analysis.get('score', 0)),
                reasons=analysis.get('reasons', []),
                skillMatches=analysis.get('skillMatches', []),
                experienceMatch=analysis.get('experienceMatch', False),
                locationMatch=analysis.get('locationMatch', False),
                salaryMatch=analysis.get('salaryMatch', False)
            )

            recommendations.append(recommendation)

        # Sort by score descending
        recommendations.sort(key=lambda x: x.score, reverse=True)

        return RecommendationResponse(recommendations=recommendations[:10])  # Top 10

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

@app.post("/career-advice", response_model=CareerAdvice)
async def get_career_advice(request: CareerAdviceRequest):
    """Provide personalized career advice based on user profile using AI"""
    try:
        user_profile = request.userProfile
        career_goals = request.careerGoals or "Not specified"

        prompt = f"""
        Provide personalized career advice based on the following user profile and career goals.

        User Profile:
        {json.dumps(user_profile, indent=2)}

        Career Goals:
        {career_goals}

        Please return a JSON object with the following structure:
        {{
            "advice": "comprehensive career advice text",
            "nextSteps": ["list", "of", "specific", "next", "steps"],
            "skillGaps": ["list", "of", "skill", "gaps", "to", "address"]
        }}

        Make the advice specific, actionable, and tailored to their profile and goals.
        """

        response = call_openai_api(prompt, max_tokens=1500)
        advice_data = parse_json_response(response)

        return CareerAdvice(
            advice=advice_data.get('advice', 'Unable to generate advice'),
            nextSteps=advice_data.get('nextSteps', []),
            skillGaps=advice_data.get('skillGaps', [])
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating career advice: {str(e)}")

@app.post("/resume-feedback", response_model=ResumeFeedback)
async def get_resume_feedback(request: ResumeFeedbackRequest):
    """Analyze resume and provide improvement suggestions using AI"""
    try:
        resume_text = request.resumeText
        job_description = request.jobDescription or "General job application"

        prompt = f"""
        Analyze the following resume and provide feedback for improvement.

        Resume Text:
        {resume_text}

        Target Job Description:
        {job_description}

        Please return a JSON object with the following structure:
        {{
            "overallScore": <number between 0-100>,
            "strengths": ["list", "of", "resume", "strengths"],
            "improvements": ["list", "of", "areas", "for", "improvement"],
            "suggestions": ["list", "of", "specific", "suggestions"]
        }}

        Evaluate the resume's effectiveness, clarity, completeness, and relevance to the job.
        """

        response = call_openai_api(prompt, max_tokens=1500)
        feedback_data = parse_json_response(response)
        if not feedback_data or isinstance(feedback_data, dict) and feedback_data.get('error'):
            raise HTTPException(status_code=500, detail=f"Error analyzing resume: {feedback_data.get('error', 'Invalid JSON response from AI')}" )

        return ResumeFeedback(
            overallScore=int(feedback_data.get('overallScore', 50)),
            strengths=feedback_data.get('strengths', []),
            improvements=feedback_data.get('improvements', []),
            suggestions=feedback_data.get('suggestions', [])
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing resume: {str(e)}")

@app.post("/interview-prep", response_model=InterviewPrep)
async def get_interview_prep(request: InterviewPrepRequest):
    """Generate interview preparation materials using AI"""
    try:
        job_title = request.jobTitle
        user_profile = request.userProfile

        prompt = f"""
        Generate interview preparation materials for the following job title and user profile.

        Job Title: {job_title}

        User Profile:
        {json.dumps(user_profile, indent=2)}

        Please return a JSON object with the following structure:
        {{
            "commonQuestions": ["list", "of", "common", "interview", "questions"],
            "technicalQuestions": ["list", "of", "technical", "questions", "based", "on", "skills"],
            "tips": ["list", "of", "interview", "tips"],
            "preparationSteps": ["list", "of", "preparation", "steps"]
        }}

        Tailor the questions and advice to the job title and user's skills/experience.
        """

        response = call_openai_api(prompt, max_tokens=1500)
        prep_data = parse_json_response(response)

        return InterviewPrep(
            commonQuestions=prep_data.get('commonQuestions', []),
            technicalQuestions=prep_data.get('technicalQuestions', []),
            tips=prep_data.get('tips', []),
            preparationSteps=prep_data.get('preparationSteps', [])
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating interview prep: {str(e)}")

@app.post("/course-recommendations", response_model=CourseRecommendation)
async def get_course_recommendations(request: CourseRecommendationRequest):
    """Recommend courses for skill development using AI"""
    try:
        user_profile = request.userProfile
        target_skills = request.targetSkills

        prompt = f"""
        Recommend courses and learning paths for the following user profile and target skills.

        User Profile:
        {json.dumps(user_profile, indent=2)}

        Target Skills:
        {json.dumps(target_skills)}

        Please return a JSON object with the following structure:
        {{
            "courses": [
                {{"title": "Course Title", "platform": "Platform Name", "url": "course_url"}},
                ...
            ],
            "learningPath": ["list", "of", "learning", "steps", "or", "path"]
        }}

        Recommend real, existing courses from platforms like Coursera, Udemy, edX, etc.
        Focus on practical, highly-rated courses.
        """

        response = call_openai_api(prompt, max_tokens=1500)
        course_data = parse_json_response(response)

        return CourseRecommendation(
            courses=course_data.get('courses', []),
            learningPath=course_data.get('learningPath', [])
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating course recommendations: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    uvicorn.run(app, host="0.0.0.0", port=8000)
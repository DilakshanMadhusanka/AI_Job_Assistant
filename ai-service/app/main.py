from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import spacy
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import nltk
from nltk.corpus import stopwords

# Download NLTK data
nltk.download('stopwords')
nltk.download('punkt')

app = FastAPI(title="AI Job Recommendation Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models
try:
    nlp = spacy.load("en_core_web_sm")
    sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
except OSError:
    # If models not available, we'll handle this in the endpoints
    nlp = None
    sentence_model = None

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
def extract_skills(text: str) -> List[str]:
    """Extract technical skills from text using NLP"""
    if not nlp:
        return []

    doc = nlp(text.lower())

    # Common technical skills
    tech_skills = [
        'python', 'javascript', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
        'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask',
        'html', 'css', 'sass', 'bootstrap', 'tailwind',
        'sql', 'mysql', 'postgresql', 'mongodb', 'redis',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git',
        'machine learning', 'ai', 'nlp', 'tensorflow', 'pytorch',
        'linux', 'windows', 'macos'
    ]

    skills = []
    for token in doc:
        if token.text in tech_skills and token.text not in skills:
            skills.append(token.text)

    return skills

def extract_experience(text: str) -> List[Dict[str, Any]]:
    """Extract work experience from resume text"""
    experience = []

    # Simple regex patterns for experience extraction
    patterns = [
        r'(\d+)\s*years?\s*(?:of)?\s*experience',
        r'(\d+)\+\s*years?\s*(?:of)?\s*experience',
        r'experience:\s*(.+)'
    ]

    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            experience.extend(matches)

    return experience

def extract_education(text: str) -> List[Dict[str, Any]]:
    """Extract education information"""
    education = []

    # Common degrees
    degrees = ['bachelor', 'master', 'phd', 'associate', 'certificate']

    for degree in degrees:
        if degree in text.lower():
            education.append({'degree': degree})

    return education

def calculate_similarity(user_profile: Dict[str, Any], job: Dict[str, Any]) -> float:
    """Calculate similarity score between user profile and job"""
    if not sentence_model:
        return 0.0

    # Combine user skills and experience
    user_text = ' '.join(user_profile.get('skills', []))
    user_text += ' ' + ' '.join([exp.get('title', '') for exp in user_profile.get('experience', [])])

    # Combine job requirements
    job_text = job.get('title', '') + ' ' + job.get('description', '')
    job_text += ' ' + ' '.join(job.get('skills', []))

    # Generate embeddings
    user_embedding = sentence_model.encode([user_text])
    job_embedding = sentence_model.encode([job_text])

    # Calculate cosine similarity
    similarity = cosine_similarity(user_embedding, job_embedding)[0][0]

    return float(similarity * 100)  # Convert to percentage

def generate_recommendation_reasons(user_profile: Dict[str, Any], job: Dict[str, Any], score: float) -> List[str]:
    """Generate reasons why this job was recommended"""
    reasons = []

    user_skills = set(user_profile.get('skills', []))
    job_skills = set(job.get('skills', []))

    skill_matches = user_skills.intersection(job_skills)
    if skill_matches:
        reasons.append(f"Matches your skills: {', '.join(skill_matches)}")

    if score > 70:
        reasons.append("High overall match with your profile")
    elif score > 50:
        reasons.append("Good match with your experience level")

    # Location match
    user_location = user_profile.get('location', '').lower()
    job_location = job.get('location', '').lower()
    if user_location and user_location in job_location:
        reasons.append("Location matches your preferences")

    return reasons

def analyze_resume_quality(text: str) -> Dict[str, Any]:
    """Analyze resume quality and provide feedback"""
    analysis = {
        'length': len(text.split()),
        'has_contact': bool(re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\S+@\S+\.\S+', text)),
        'has_skills': len(extract_skills(text)) > 0,
        'has_experience': len(extract_experience(text)) > 0,
        'has_education': len(extract_education(text)) > 0,
        'sections': []
    }

    # Check for common sections
    sections = ['experience', 'education', 'skills', 'projects', 'certifications']
    for section in sections:
        if section.lower() in text.lower():
            analysis['sections'].append(section)

    return analysis

def generate_skill_gaps(user_skills: List[str], job_skills: List[str]) -> List[str]:
    """Identify skill gaps between user and job requirements"""
    user_skill_set = set(user_skills)
    job_skill_set = set(job_skills)

    gaps = job_skill_set - user_skill_set
    return list(gaps)

def generate_interview_questions(job_title: str, user_profile: Dict[str, Any]) -> Dict[str, List[str]]:
    """Generate interview questions based on job title and user profile"""
    questions = {
        'common': [
            'Tell me about yourself',
            'What are your strengths and weaknesses?',
            'Why are you interested in this position?',
            'Where do you see yourself in 5 years?',
            'Why do you want to work for our company?'
        ],
        'technical': [],
        'behavioral': []
    }

    # Generate technical questions based on skills
    user_skills = user_profile.get('skills', [])
    if 'python' in user_skills:
        questions['technical'].extend([
            'Explain Python decorators and their use cases',
            'How does Python memory management work?',
            'Describe list comprehensions and when to use them'
        ])

    if 'javascript' in user_skills:
        questions['technical'].extend([
            'Explain closures in JavaScript',
            'What is the difference between let, const, and var?',
            'How does the event loop work in JavaScript?'
        ])

    if 'react' in user_skills:
        questions['technical'].extend([
            'Explain the virtual DOM in React',
            'What are hooks in React and why were they introduced?',
            'How do you manage state in a React application?'
        ])

    # Job-specific questions
    job_lower = job_title.lower()
    if 'frontend' in job_lower or 'ui' in job_lower:
        questions['technical'].extend([
            'How do you ensure cross-browser compatibility?',
            'Explain responsive design principles',
            'What tools do you use for debugging frontend issues?'
        ])

    if 'backend' in job_lower or 'server' in job_lower:
        questions['technical'].extend([
            'How do you handle database connections and queries?',
            'Explain RESTful API design principles',
            'How do you implement authentication and authorization?'
        ])

    return questions

def recommend_courses(skill_gaps: List[str]) -> List[Dict[str, str]]:
    """Recommend courses for skill gaps"""
    course_recommendations = []

    course_map = {
        'python': [
            {'title': 'Python for Everybody', 'platform': 'Coursera', 'url': 'https://www.coursera.org/specializations/python'},
            {'title': 'Complete Python Bootcamp', 'platform': 'Udemy', 'url': 'https://www.udemy.com/course/complete-python-bootcamp/'}
        ],
        'javascript': [
            {'title': 'JavaScript Algorithms and Data Structures', 'platform': 'freeCodeCamp', 'url': 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/'},
            {'title': 'Modern JavaScript From The Beginning', 'platform': 'Udemy', 'url': 'https://www.udemy.com/course/modern-javascript-from-the-beginning/'}
        ],
        'react': [
            {'title': 'React - The Complete Guide', 'platform': 'Udemy', 'url': 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/'},
            {'title': 'React Fundamentals', 'platform': 'Codecademy', 'url': 'https://www.codecademy.com/learn/react-101'}
        ],
        'node.js': [
            {'title': 'Node.js Complete Guide', 'platform': 'Udemy', 'url': 'https://www.udemy.com/course/nodejs-the-complete-guide/'},
            {'title': 'Learn Node.js', 'platform': 'Codecademy', 'url': 'https://www.codecademy.com/learn/learn-node-js'}
        ],
        'machine learning': [
            {'title': 'Machine Learning by Andrew Ng', 'platform': 'Coursera', 'url': 'https://www.coursera.org/learn/machine-learning'},
            {'title': 'Practical Machine Learning', 'platform': 'edX', 'url': 'https://www.edx.org/course/practical-machine-learning'}
        ]
    }

    for skill in skill_gaps:
        skill_lower = skill.lower()
        if skill_lower in course_map:
            course_recommendations.extend(course_map[skill_lower][:2])  # Limit to 2 courses per skill

    return course_recommendations[:5]  # Limit total recommendations

# API endpoints
@app.post("/parse-resume", response_model=Dict[str, Any])
async def parse_resume(request: ResumeParseRequest):
    """Parse resume text and extract structured information"""
    try:
        text = request.text

        # Extract information
        skills = extract_skills(text)
        experience = extract_experience(text)
        education = extract_education(text)

        # Simple certification extraction
        certifications = []
        cert_patterns = ['certified', 'certificate', 'certification']
        for pattern in cert_patterns:
            if pattern in text.lower():
                certifications.append(pattern.title())

        return {
            'skills': skills,
            'experience': experience,
            'education': education,
            'certifications': certifications
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing resume: {str(e)}")

@app.post("/recommend-jobs", response_model=RecommendationResponse)
async def recommend_jobs(request: JobRecommendationRequest):
    """Generate job recommendations based on user profile"""
    try:
        user_profile = request.userProfile
        jobs = request.jobs

        recommendations = []

        for job in jobs:
            # Calculate similarity score
            score = calculate_similarity(user_profile, job)

            # Generate reasons
            reasons = generate_recommendation_reasons(user_profile, job, score)

            # Check matches
            user_skills = set(user_profile.get('skills', []))
            job_skills = set(job.get('skills', []))
            skill_matches = list(user_skills.intersection(job_skills))

            # Simple location match
            location_match = False
            if user_profile.get('location') and job.get('location'):
                location_match = user_profile['location'].lower() in job['location'].lower()

            # Simple salary match (placeholder)
            salary_match = True  # Could implement more sophisticated logic

            # Experience match (placeholder)
            experience_match = True

            recommendation = Recommendation(
                jobId=job['jobId'],
                score=round(score, 2),
                reasons=reasons,
                skillMatches=skill_matches,
                experienceMatch=experience_match,
                locationMatch=location_match,
                salaryMatch=salary_match
            )

            recommendations.append(recommendation)

        # Sort by score descending
        recommendations.sort(key=lambda x: x.score, reverse=True)

        return RecommendationResponse(recommendations=recommendations[:10])  # Top 10

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

@app.post("/career-advice", response_model=CareerAdvice)
async def get_career_advice(request: CareerAdviceRequest):
    """Provide personalized career advice based on user profile"""
    try:
        user_profile = request.userProfile
        career_goals = request.careerGoals

        skills = user_profile.get('skills', [])
        experience = user_profile.get('experience', [])
        education = user_profile.get('education', [])

        # Analyze current situation
        experience_level = 'entry' if len(experience) < 2 else 'mid' if len(experience) < 5 else 'senior'
        skill_count = len(skills)

        # Generate advice
        advice_parts = []

        if experience_level == 'entry':
            advice_parts.append("You're at an early stage in your career. Focus on building a strong foundation and gaining diverse experience.")
        elif experience_level == 'mid':
            advice_parts.append("You have solid experience. Consider specializing in a niche area or taking on leadership roles.")
        else:
            advice_parts.append("With your extensive experience, you should focus on mentoring others and strategic career moves.")

        if skill_count < 5:
            advice_parts.append("Consider expanding your skill set to increase your marketability.")
        elif skill_count > 10:
            advice_parts.append("You have a diverse skill set. Consider deepening expertise in your strongest areas.")

        advice = " ".join(advice_parts)

        # Generate next steps
        next_steps = []
        if experience_level == 'entry':
            next_steps.extend([
                "Complete relevant certifications in your field",
                "Seek mentorship from experienced professionals",
                "Take on challenging projects to build your portfolio"
            ])
        else:
            next_steps.extend([
                "Pursue advanced certifications or degrees",
                "Network with industry leaders",
                "Consider speaking at conferences or writing technical articles"
            ])

        # Identify skill gaps (simplified)
        common_skills = ['communication', 'leadership', 'problem-solving', 'project-management']
        user_skill_names = [s.lower() for s in skills]
        skill_gaps = [skill for skill in common_skills if skill not in ' '.join(user_skill_names)]

        return CareerAdvice(
            advice=advice,
            nextSteps=next_steps,
            skillGaps=skill_gaps
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating career advice: {str(e)}")

@app.post("/resume-feedback", response_model=ResumeFeedback)
async def get_resume_feedback(request: ResumeFeedbackRequest):
    """Analyze resume and provide improvement suggestions"""
    try:
        resume_text = request.resumeText
        job_description = request.jobDescription

        analysis = analyze_resume_quality(resume_text)

        # Calculate score based on various factors
        score = 50  # Base score

        if analysis['has_contact']: score += 10
        if analysis['has_skills']: score += 15
        if analysis['has_experience']: score += 15
        if analysis['has_education']: score += 10

        if analysis['length'] > 300: score += 5
        elif analysis['length'] < 150: score -= 10

        score = min(100, max(0, score))

        # Generate feedback
        strengths = []
        improvements = []
        suggestions = []

        if analysis['has_contact']:
            strengths.append("Contact information is clearly provided")
        else:
            improvements.append("Add contact information (phone and email)")

        if analysis['has_skills']:
            strengths.append("Skills section is present")
        else:
            improvements.append("Add a dedicated skills section")

        if analysis['has_experience']:
            strengths.append("Work experience is documented")
        else:
            improvements.append("Add work experience section")

        if analysis['length'] > 300:
            strengths.append("Resume has good length and detail")
        elif analysis['length'] < 150:
            improvements.append("Resume seems too brief - add more details")

        # Job-specific suggestions
        if job_description:
            job_skills = extract_skills(job_description)
            resume_skills = extract_skills(resume_text)
            missing_skills = set(job_skills) - set(resume_skills)

            if missing_skills:
                suggestions.append(f"Consider adding these job-relevant skills: {', '.join(list(missing_skills)[:3])}")

        suggestions.extend([
            "Use action verbs to describe your accomplishments",
            "Quantify your achievements with numbers when possible",
            "Tailor your resume for each job application",
            "Keep it to 1-2 pages for most positions"
        ])

        return ResumeFeedback(
            overallScore=score,
            strengths=strengths,
            improvements=improvements,
            suggestions=suggestions
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing resume: {str(e)}")

@app.post("/interview-prep", response_model=InterviewPrep)
async def get_interview_prep(request: InterviewPrepRequest):
    """Generate interview preparation materials"""
    try:
        job_title = request.jobTitle
        user_profile = request.userProfile

        questions = generate_interview_questions(job_title, user_profile)

        tips = [
            "Research the company thoroughly before the interview",
            "Prepare examples using the STAR method (Situation, Task, Action, Result)",
            "Practice your answers out loud",
            "Prepare thoughtful questions to ask the interviewer",
            "Follow up with a thank-you email within 24 hours"
        ]

        preparation_steps = [
            "Review your resume and be ready to discuss any aspect of it",
            "Research common interview questions for your field",
            "Practice coding problems if applying for technical roles",
            "Prepare for behavioral questions about past experiences",
            "Think about your career goals and how this role fits"
        ]

        return InterviewPrep(
            commonQuestions=questions['common'],
            technicalQuestions=questions['technical'][:5],  # Limit to 5
            tips=tips,
            preparationSteps=preparation_steps
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating interview prep: {str(e)}")

@app.post("/course-recommendations", response_model=CourseRecommendation)
async def get_course_recommendations(request: CourseRecommendationRequest):
    """Recommend courses for skill development"""
    try:
        user_profile = request.userProfile
        target_skills = request.targetSkills

        user_skills = user_profile.get('skills', [])
        skill_gaps = generate_skill_gaps(user_skills, target_skills)

        courses = recommend_courses(skill_gaps)

        # Generate learning path
        learning_path = []
        if skill_gaps:
            learning_path.append(f"Start with foundational courses in: {', '.join(skill_gaps[:3])}")
            learning_path.append("Practice with small projects to apply new skills")
            learning_path.append("Join online communities for support and networking")
            learning_path.append("Consider certifications to validate your learning")
        else:
            learning_path.append("Your skills are well-aligned with your targets")
            learning_path.append("Focus on deepening expertise in your strongest areas")
            learning_path.append("Consider advanced or specialized courses")

        return CourseRecommendation(
            courses=courses,
            learningPath=learning_path
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
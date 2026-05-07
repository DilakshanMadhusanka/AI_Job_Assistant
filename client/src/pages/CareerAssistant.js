import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Lightbulb, FileText, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const CareerAssistant = () => {
  const { user } = useAuth();
  const [careerGoals, setCareerGoals] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [targetSkills, setTargetSkills] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [careerAdvice, setCareerAdvice] = useState(null);
  const [resumeFeedback, setResumeFeedback] = useState(null);
  const [interviewPrep, setInterviewPrep] = useState(null);
  const [courseRecommendations, setCourseRecommendations] = useState(null);

  const handleCareerAdvice = async () => {
    if (!careerGoals) {
      toast.error('Please enter your career goals');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post('/api/jobs/career-advice', { careerGoals });
      setCareerAdvice(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch career advice');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeFeedback = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/jobs/resume-feedback', { jobDescription });
      setResumeFeedback(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch resume feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterviewPrep = async () => {
    if (!jobTitle) {
      toast.error('Please enter a job title');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post('/api/jobs/interview-prep', { jobTitle });
      setInterviewPrep(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch interview prep');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseRecommendations = async () => {
    const skills = targetSkills.split(',').map(skill => skill.trim()).filter(Boolean);
    if (skills.length === 0) {
      toast.error('Please enter target skills');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post('/api/jobs/course-recommendations', { targetSkills: skills });
      setCourseRecommendations(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch course recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="h-7 w-7 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">AI Career Assistant</h1>
          <p className="text-gray-600">Use the assistant to get career advice, resume feedback, interview preparation, and course recommendations.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-purple-600" />
            <h2 className="text-xl font-semibold">Career Advice</h2>
          </div>
          <textarea
            value={careerGoals}
            onChange={(e) => setCareerGoals(e.target.value)}
            rows="4"
            className="input-field h-32"
            placeholder="Describe your goals, current role, or what you want to achieve"
          />
          <button
            onClick={handleCareerAdvice}
            disabled={isLoading}
            className="mt-4 btn-primary"
          >
            Get Career Advice
          </button>
          {careerAdvice && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Advice</h3>
              <p className="text-gray-700 mb-3">{careerAdvice.advice}</p>
              <h4 className="font-semibold mb-1">Next Steps</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1 mb-3">
                {careerAdvice.nextSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
              <h4 className="font-semibold mb-1">Skill Gaps</h4>
              <div className="flex flex-wrap gap-2">
                {careerAdvice.skillGaps.length > 0 ? (
                  careerAdvice.skillGaps.map((gap, index) => (
                    <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">{gap}</span>
                  ))
                ) : (
                  <span className="text-gray-600">No major gaps detected.</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold">Resume Feedback</h2>
          </div>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows="4"
            className="input-field h-32"
            placeholder="Optional: paste a job description to tailor resume feedback"
          />
          <button
            onClick={handleResumeFeedback}
            disabled={isLoading}
            className="mt-4 btn-primary"
          >
            Analyze Resume
          </button>
          {resumeFeedback && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <div className="mb-3">
                <span className="block text-sm text-gray-600">Overall Score</span>
                <p className="text-2xl font-semibold text-blue-700">{resumeFeedback.overallScore}%</p>
              </div>
              <div className="mb-3">
                <h4 className="font-semibold">Strengths</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {resumeFeedback.strengths.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="mb-3">
                <h4 className="font-semibold">Improvements</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {resumeFeedback.improvements.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold">Suggestions</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {resumeFeedback.suggestions.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Interview Preparation</h2>
          </div>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="input-field"
            placeholder="Enter a target job title"
          />
          <button
            onClick={handleInterviewPrep}
            disabled={isLoading}
            className="mt-4 btn-primary"
          >
            Get Interview Prep
          </button>
          {interviewPrep && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <div className="mb-3">
                <h4 className="font-semibold">Common Questions</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {interviewPrep.commonQuestions.map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ul>
              </div>
              <div className="mb-3">
                <h4 className="font-semibold">Technical Questions</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {interviewPrep.technicalQuestions.map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold">Tips</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {interviewPrep.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-teal-600" />
            <h2 className="text-xl font-semibold">Course Recommendations</h2>
          </div>
          <input
            type="text"
            value={targetSkills}
            onChange={(e) => setTargetSkills(e.target.value)}
            className="input-field"
            placeholder="Enter missing skills separated by commas"
          />
          <button
            onClick={handleCourseRecommendations}
            disabled={isLoading}
            className="mt-4 btn-primary"
          >
            Find Courses
          </button>
          {courseRecommendations && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Recommended Courses</h4>
              <div className="space-y-3">
                {courseRecommendations.courses.map((course, index) => (
                  <div key={index} className="p-3 rounded-lg border border-gray-200 bg-white">
                    <p className="font-medium">{course.title}</p>
                    <p className="text-gray-600">{course.platform}</p>
                    <a href={course.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">
                      View course
                    </a>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <h4 className="font-semibold">Learning Path</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {courseRecommendations.learningPath.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareerAssistant;

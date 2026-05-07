import React, { useState } from 'react';
import axios from 'axios';
import { FileText, CheckCircle, AlertTriangle, Lightbulb, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const ResumeFeedback = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGetFeedback = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/jobs/resume-feedback', {
        jobDescription: jobDescription || undefined
      });
      setFeedback(response.data);
      toast.success('Resume feedback generated!');
    } catch (error) {
      console.error('Error getting resume feedback:', error);
      toast.error('Failed to get resume feedback');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Resume Analysis & Feedback</h1>
        <p className="text-gray-600">
          Get AI-powered feedback on your resume to improve your chances of getting hired.
        </p>
      </div>

      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FileText className="h-6 w-6 mr-2 text-blue-600" />
          Analyze Your Resume
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description (Optional)
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description you're applying for to get tailored feedback..."
              className="input-field h-32 resize-none"
            />
          </div>

          <button
            onClick={handleGetFeedback}
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Analyzing Resume...' : 'Get AI Resume Feedback'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Overall Resume Score</h3>
              <div className={`flex items-center px-4 py-2 rounded-full ${getScoreBgColor(feedback.overallScore)}`}>
                <Star className={`h-5 w-5 mr-2 ${getScoreColor(feedback.overallScore)}`} />
                <span className={`text-xl font-bold ${getScoreColor(feedback.overallScore)}`}>
                  {feedback.overallScore}/100
                </span>
              </div>
            </div>
          </div>

          {/* Strengths */}
          {feedback.strengths && feedback.strengths.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Strengths
              </h3>
              <ul className="space-y-2">
                {feedback.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {feedback.improvements && feedback.improvements.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {feedback.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {feedback.suggestions && feedback.suggestions.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-blue-600" />
                Suggestions
              </h3>
              <ul className="space-y-2">
                {feedback.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <Lightbulb className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeFeedback;
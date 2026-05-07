import React, { useState } from 'react';
import axios from 'axios';
import { MessageSquare, HelpCircle, Lightbulb, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const InterviewPrep = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [prepData, setPrepData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGetPrep = async () => {
    if (!jobTitle.trim()) {
      toast.error('Please enter a job title');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/jobs/interview-prep', {
        jobTitle: jobTitle.trim()
      });
      setPrepData(response.data);
      toast.success('Interview preparation generated!');
    } catch (error) {
      console.error('Error getting interview prep:', error);
      toast.error('Failed to get interview preparation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Interview Preparation</h1>
        <p className="text-gray-600">
          Get AI-generated interview questions and preparation tips tailored to your target role.
        </p>
      </div>

      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <MessageSquare className="h-6 w-6 mr-2 text-blue-600" />
          Prepare for Your Interview
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Software Engineer, Product Manager, Data Scientist"
              className="input-field"
            />
          </div>

          <button
            onClick={handleGetPrep}
            disabled={loading || !jobTitle.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Generating Preparation...' : 'Get Interview Prep'}
          </button>
        </div>
      </div>

      {prepData && (
        <div className="space-y-6">
          {/* Common Questions */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <HelpCircle className="h-5 w-5 mr-2 text-blue-600" />
              Common Interview Questions
            </h3>
            <div className="space-y-3">
              {prepData.commonQuestions.map((question, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{question}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Questions */}
          {prepData.technicalQuestions && prepData.technicalQuestions.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <HelpCircle className="h-5 w-5 mr-2 text-green-600" />
                Technical Questions
              </h3>
              <div className="space-y-3">
                {prepData.technicalQuestions.map((question, index) => (
                  <div key={index} className="p-3 bg-green-50 rounded-lg">
                    <p className="font-medium text-gray-900">{question}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-yellow-600" />
              Interview Tips
            </h3>
            <ul className="space-y-2">
              {prepData.tips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <Lightbulb className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Preparation Steps */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <CheckSquare className="h-5 w-5 mr-2 text-purple-600" />
              Preparation Steps
            </h3>
            <ol className="space-y-2">
              {prepData.preparationSteps.map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPrep;
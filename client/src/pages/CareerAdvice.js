import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Brain, Target, BookOpen, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const CareerAdvice = () => {
  const { user } = useAuth();
  const [careerGoals, setCareerGoals] = useState('');
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGetAdvice = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/jobs/career-advice', {
        careerGoals: careerGoals || undefined
      });
      setAdvice(response.data);
      toast.success('Career advice generated!');
    } catch (error) {
      console.error('Error getting career advice:', error);
      toast.error('Failed to get career advice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">AI Career Assistant</h1>
        <p className="text-gray-600">
          Get personalized career advice based on your profile and goals.
        </p>
      </div>

      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Brain className="h-6 w-6 mr-2 text-blue-600" />
          Get Career Advice
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Career Goals (Optional)
            </label>
            <textarea
              value={careerGoals}
              onChange={(e) => setCareerGoals(e.target.value)}
              placeholder="e.g., Become a senior software engineer, start my own company, etc."
              className="input-field h-24 resize-none"
            />
          </div>

          <button
            onClick={handleGetAdvice}
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Generating Advice...' : 'Get AI Career Advice'}
          </button>
        </div>
      </div>

      {advice && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Target className="h-5 w-5 mr-2 text-green-600" />
              Career Advice
            </h3>
            <p className="text-gray-700">{advice.advice}</p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Next Steps
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {advice.nextSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>

          {advice.skillGaps && advice.skillGaps.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-orange-600" />
                Skill Gaps to Address
              </h3>
              <div className="flex flex-wrap gap-2">
                {advice.skillGaps.map((skill, index) => (
                  <span key={index} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CareerAdvice;
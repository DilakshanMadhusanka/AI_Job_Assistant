import React, { useState } from 'react';
import axios from 'axios';
import { GraduationCap, ExternalLink, BookOpen, Target } from 'lucide-react';
import toast from 'react-hot-toast';

const CourseRecommendations = () => {
  const [targetSkills, setTargetSkills] = useState('');
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGetRecommendations = async () => {
    const skills = targetSkills.split(',').map(skill => skill.trim()).filter(skill => skill);
    if (skills.length === 0) {
      toast.error('Please enter at least one target skill');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/jobs/course-recommendations', {
        targetSkills: skills
      });
      setRecommendations(response.data);
      toast.success('Course recommendations generated!');
    } catch (error) {
      console.error('Error getting course recommendations:', error);
      toast.error('Failed to get course recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Course Recommendations</h1>
        <p className="text-gray-600">
          Get personalized course recommendations to bridge skill gaps and advance your career.
        </p>
      </div>

      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <GraduationCap className="h-6 w-6 mr-2 text-blue-600" />
          Find Courses for Skill Development
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Skills (comma-separated)
            </label>
            <input
              type="text"
              value={targetSkills}
              onChange={(e) => setTargetSkills(e.target.value)}
              placeholder="e.g., Python, React, Machine Learning, AWS"
              className="input-field"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter skills you want to learn or improve
            </p>
          </div>

          <button
            onClick={handleGetRecommendations}
            disabled={loading || !targetSkills.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Finding Courses...' : 'Get Course Recommendations'}
          </button>
        </div>
      </div>

      {recommendations && (
        <div className="space-y-6">
          {/* Courses */}
          {recommendations.courses && recommendations.courses.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                Recommended Courses
              </h3>
              <div className="grid gap-4">
                {recommendations.courses.map((course, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {course.title}
                        </h4>
                        <p className="text-sm text-blue-600 mb-2">
                          {course.platform}
                        </p>
                      </div>
                      <a
                        href={course.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Course
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Path */}
          {recommendations.learningPath && recommendations.learningPath.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2 text-purple-600" />
                Learning Path
              </h3>
              <div className="space-y-3">
                {recommendations.learningPath.map((step, index) => (
                  <div key={index} className="flex items-start">
                    <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!recommendations.courses || recommendations.courses.length === 0) && (
            <div className="card">
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  No specific course recommendations available for the entered skills.
                  Consider exploring general programming or career development courses.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseRecommendations;
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Upload, Briefcase, Heart, TrendingUp, FileText, MessageSquare } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    recommendationsCount: 0,
    savedJobsCount: 0,
    resumeUploaded: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [recommendationsRes, savedJobsRes] = await Promise.all([
          axios.get(`/api/jobs/recommendations/${user.id}`),
          axios.get(`/api/jobs/saved/${user.id}`)
        ]);

        setStats({
          recommendationsCount: recommendationsRes.data.recommendations?.length || 0,
          savedJobsCount: savedJobsRes.data.length || 0,
          resumeUploaded: !!user.resume
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Welcome back, {user?.name}!</h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">{stats.recommendationsCount}</p>
              <p className="text-gray-600">Job Recommendations</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-2xl font-bold">{stats.savedJobsCount}</p>
              <p className="text-gray-600">Saved Jobs</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <FileText className={`h-8 w-8 mr-3 ${stats.resumeUploaded ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-2xl font-bold">{stats.resumeUploaded ? 'Yes' : 'No'}</p>
              <p className="text-gray-600">Resume Uploaded</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Get Started</h2>
          <div className="space-y-3">
            {!stats.resumeUploaded && (
              <Link
                to="/upload-resume"
                className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Upload className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium">Upload Your Resume</p>
                  <p className="text-sm text-gray-600">Let AI analyze your skills and experience</p>
                </div>
              </Link>
            )}

            <Link
              to="/recommendations"
              className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <TrendingUp className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <p className="font-medium">View Recommendations</p>
                <p className="text-sm text-gray-600">See AI-matched job opportunities</p>
              </div>
            </Link>

            <Link
              to="/saved-jobs"
              className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Heart className="h-5 w-5 text-purple-600 mr-3" />
              <div>
                <p className="font-medium">Saved Jobs</p>
                <p className="text-sm text-gray-600">Review your favorite positions</p>
              </div>
            </Link>

            <Link
              to="/assistant"
              className="flex items-center p-3 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
            >
              <MessageSquare className="h-5 w-5 text-teal-600 mr-3" />
              <div>
                <p className="font-medium">AI Assistant</p>
                <p className="text-sm text-gray-600">Get advice, feedback, and preparation tools</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Skills</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {user?.profile?.skills?.slice(0, 5).map((skill, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {skill}
                  </span>
                )) || <span className="text-gray-500">No skills extracted yet</span>}
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600">Experience Level</p>
              <p className="font-medium">
                {user?.profile?.experience?.length > 0 ? 'Experienced' : 'Entry Level'}
              </p>
            </div>

            <Link
              to="/profile"
              className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              View Full Profile →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
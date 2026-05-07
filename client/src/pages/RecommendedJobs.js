import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, DollarSign, Clock, ExternalLink, Heart, RefreshCw, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

const RecommendedJobs = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get(`/api/jobs/recommendations/${user.id}`);
      setRecommendations(response.data.recommendations || []);
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const handleSaveJob = async (jobId, title, company) => {
    try {
      await axios.post('/api/jobs/save', { jobId, title, company });
      toast.success('Job saved successfully!');
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error('Failed to save job');
    }
  };

  const getJobById = (jobId) => {
    return jobs.find(job => job.jobId === jobId);
  };

  const getMatchColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Job Recommendations</h1>
        <button
          onClick={fetchRecommendations}
          disabled={refreshing}
          className="flex items-center gap-2 btn-primary disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Briefcase className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No recommendations yet</h2>
          <p className="text-gray-500 mb-4">
            Upload your resume to get personalized job recommendations.
          </p>
          <Link to="/upload-resume" className="btn-primary">
            Upload Resume
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {recommendations.map((rec) => {
            const job = getJobById(rec.jobId);
            if (!job) return null;

            return (
              <div key={rec.jobId} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {job.title}
                    </h2>
                    <p className="text-lg text-gray-600 mb-2">{job.company}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </div>
                      {job.salary && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {job.salary.min}-{job.salary.max} {job.salary.currency}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {job.employmentType}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getMatchColor(rec.score)}`}>
                      {rec.score}% Match
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 line-clamp-3">{job.description}</p>
                </div>

                {rec.reasons && rec.reasons.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Why this job matches you:</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {rec.reasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {rec.skillMatches && rec.skillMatches.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Matching Skills:</h3>
                    <div className="flex flex-wrap gap-2">
                      {rec.skillMatches.map((skill, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 btn-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Apply Now
                  </a>

                  <button
                    onClick={() => handleSaveJob(job.jobId, job.title, job.company)}
                    className="flex items-center gap-2 btn-secondary"
                  >
                    <Heart className="h-4 w-4" />
                    Save Job
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecommendedJobs;
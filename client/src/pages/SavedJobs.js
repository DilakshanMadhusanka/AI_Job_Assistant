import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Calendar, ExternalLink, Trash2, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

const SavedJobs = () => {
  const { user } = useAuth();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        const response = await axios.get(`/api/jobs/saved/${user.id}`);
        setSavedJobs(response.data);
      } catch (error) {
        console.error('Error fetching saved jobs:', error);
        toast.error('Failed to load saved jobs');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSavedJobs();
    }
  }, [user]);

  const handleRemoveJob = async (jobId) => {
    try {
      // Note: This would require a delete endpoint in the backend
      // For now, we'll just remove from local state
      setSavedJobs(savedJobs.filter(job => job.jobId !== jobId));
      toast.success('Job removed from saved list');
    } catch (error) {
      console.error('Error removing job:', error);
      toast.error('Failed to remove job');
    }
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
      <h1 className="text-3xl font-bold mb-8">Saved Jobs</h1>

      {savedJobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Heart className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No saved jobs yet</h2>
          <p className="text-gray-500 mb-4">
            Start exploring job recommendations and save the ones you're interested in.
          </p>
          <Link to="/recommendations" className="btn-primary">
            View Recommendations
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {savedJobs.map((job) => (
            <div key={job.jobId} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {job.title}
                  </h2>
                  <p className="text-lg text-gray-600 mb-2">{job.company}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Saved on {new Date(job.savedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveJob(job.jobId)}
                  className="text-red-600 hover:text-red-800 p-2"
                  title="Remove from saved jobs"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              <div className="flex gap-3">
                <button className="flex items-center gap-2 btn-primary">
                  <ExternalLink className="h-4 w-4" />
                  Apply Now
                </button>

                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Heart className="h-4 w-4 fill-current" />
                  Saved
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedJobs;
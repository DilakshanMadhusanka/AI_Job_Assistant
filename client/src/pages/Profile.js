import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, MapPin, Briefcase, GraduationCap, Award, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    preferences: {
      location: '',
      remoteWork: false,
      salaryRange: { min: '', max: '' },
      jobType: []
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        preferences: {
          location: user.preferences?.location || '',
          remoteWork: user.preferences?.remoteWork || false,
          salaryRange: {
            min: user.preferences?.salaryRange?.min || '',
            max: user.preferences?.salaryRange?.max || ''
          },
          jobType: user.preferences?.jobType || []
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleJobTypeChange = (jobType) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        jobType: prev.preferences.jobType.includes(jobType)
          ? prev.preferences.jobType.filter(type => type !== jobType)
          : [...prev.preferences.jobType, jobType]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateProfile(formData);

    if (result.success) {
      toast.success('Profile updated successfully!');
      setEditing(false);
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  };

  const jobTypes = ['full-time', 'part-time', 'contract', 'freelance', 'internship'];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div className="card">
          <div className="flex items-center mb-6">
            <User className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold">Personal Information</h2>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Location
                </label>
                <input
                  type="text"
                  name="preferences.location"
                  value={formData.preferences.location}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., New York, NY"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remoteWork"
                  name="preferences.remoteWork"
                  checked={formData.preferences.remoteWork}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label htmlFor="remoteWork" className="text-sm font-medium text-gray-700">
                  Open to remote work
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Salary ($)
                  </label>
                  <input
                    type="number"
                    name="preferences.salaryRange.min"
                    value={formData.preferences.salaryRange.min}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Salary ($)
                  </label>
                  <input
                    type="number"
                    name="preferences.salaryRange.max"
                    value={formData.preferences.salaryRange.max}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="100000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Job Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {jobTypes.map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.preferences.jobType.includes(type)}
                        onChange={() => handleJobTypeChange(type)}
                        className="mr-2"
                      />
                      <span className="text-sm capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{user?.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Preferred Location</p>
                <p className="font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {user?.preferences?.location || 'Not specified'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Remote Work</p>
                <p className="font-medium">
                  {user?.preferences?.remoteWork ? 'Open to remote' : 'Office-based preferred'}
                </p>
              </div>

              <button
                onClick={() => setEditing(true)}
                className="btn-primary mt-4"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Resume Information */}
        <div className="card">
          <div className="flex items-center mb-6">
            <Briefcase className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold">Resume Information</h2>
          </div>

          {user?.profile ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {user.profile.skills?.map((skill, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {skill}
                    </span>
                  )) || <span className="text-gray-500">No skills extracted</span>}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Experience</p>
                {user.profile.experience?.length > 0 ? (
                  <div className="space-y-2">
                    {user.profile.experience.map((exp, index) => (
                      <div key={index} className="text-sm">
                        <p className="font-medium">{exp.title} at {exp.company}</p>
                        <p className="text-gray-600">{exp.duration}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No experience information</p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Education</p>
                {user.profile.education?.length > 0 ? (
                  <div className="space-y-2">
                    {user.profile.education.map((edu, index) => (
                      <div key={index} className="text-sm">
                        <p className="font-medium">{edu.degree}</p>
                        <p className="text-gray-600">{edu.institution}, {edu.year}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No education information</p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Certifications</p>
                <div className="flex flex-wrap gap-2">
                  {user.profile.certifications?.map((cert, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      {cert}
                    </span>
                  )) || <span className="text-gray-500">No certifications</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No resume uploaded yet</p>
              <Link to="/upload-resume" className="btn-primary">
                Upload Resume
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
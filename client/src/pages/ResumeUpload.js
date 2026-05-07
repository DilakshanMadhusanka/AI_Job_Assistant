import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Please select a PDF or DOCX file');
        return;
      }

      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await axios.post('/api/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      toast.success('Resume uploaded and analyzed successfully!');
      navigate('/recommendations');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">Upload Your Resume</h1>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Upload your resume in PDF or DOCX format. Our AI will analyze your skills,
            experience, and qualifications to provide personalized job recommendations.
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="hidden"
              id="resume-upload"
              disabled={uploading}
            />

            <label
              htmlFor="resume-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              {file ? (
                <>
                  <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Click to upload your resume
                  </p>
                  <p className="text-sm text-gray-600">
                    PDF or DOCX files up to 10MB
                  </p>
                </>
              )}
            </label>
          </div>
        </div>

        {uploading && (
          <div className="mb-6">
            <div className="bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Uploading and analyzing... {uploadProgress}%
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Processing...' : 'Upload & Analyze'}
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="btn-secondary py-3"
          >
            Cancel
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• AI extracts your skills, experience, and education</li>
            <li>• System analyzes your qualifications</li>
            <li>• Generates personalized job recommendations</li>
            <li>• You can view and save matching opportunities</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;
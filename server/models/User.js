const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  profile: {
    skills: [String],
    experience: [{
      title: String,
      company: String,
      duration: String,
      description: String
    }],
    education: [{
      degree: String,
      institution: String,
      year: Number
    }],
    certifications: [String],
    interests: [String]
  },
  resume: {
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  savedJobs: [{
    jobId: String,
    title: String,
    company: String,
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    location: String,
    remoteWork: Boolean,
    salaryRange: {
      min: Number,
      max: Number
    },
    jobType: [String] // full-time, part-time, contract, etc.
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
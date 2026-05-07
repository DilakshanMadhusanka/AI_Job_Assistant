const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  location: String,
  salary: {
    min: Number,
    max: Number,
    currency: String
  },
  employmentType: String, // full-time, part-time, contract
  remoteWork: Boolean,
  description: String,
  requirements: [String],
  applyUrl: String,
  source: String, // JSearch, Adzuna, JobDataLake
  postedDate: Date,
  skills: [String],
  experience: String,
  education: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);
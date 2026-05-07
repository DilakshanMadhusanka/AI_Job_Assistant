const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const Job = require('../models/Job');
const Recommendation = require('../models/Recommendation');

const router = express.Router();

// Fetch jobs from external APIs
const fetchJobsFromAPIs = async (query = '', location = '', limit = 10) => {
  const jobs = [];
  const normalizedQuery = query || 'software developer';
  const normalizedLocation = location || 'remote';

  try {
    // JSearch API
    if (process.env.JSEARCH_API_KEY) {
      const jsearchResponse = await axios.get('https://jsearch.p.rapidapi.com/search', {
        headers: {
          'X-RapidAPI-Key': process.env.JSEARCH_API_KEY,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        },
        params: {
          query: normalizedQuery,
          location: normalizedLocation,
          num_pages: Math.ceil(limit / 10)
        }
      });

      if (jsearchResponse.data?.data) {
        jobs.push(...jsearchResponse.data.data.map(job => ({
          jobId: job.job_id,
          title: job.job_title,
          company: job.employer_name,
          location: [job.job_city, job.job_country].filter(Boolean).join(', '),
          salary: {
            min: job.job_min_salary,
            max: job.job_max_salary,
            currency: job.job_salary_currency
          },
          employmentType: job.job_employment_type,
          remoteWork: job.job_is_remote,
          description: job.job_description,
          applyUrl: job.job_apply_link,
          source: 'JSearch',
          postedDate: job.job_posted_at_datetime_utc,
          skills: Array.isArray(job.job_required_skills) ? job.job_required_skills : []
        })));
      }
    }

    // Adzuna API
    if (process.env.ADZUNA_API_KEY && process.env.ADZUNA_APP_ID) {
      const adzunaResponse = await axios.get('https://api.adzuna.com/v1/api/jobs/gb/search/1', {
        params: {
          app_id: process.env.ADZUNA_APP_ID,
          app_key: process.env.ADZUNA_API_KEY,
          what: normalizedQuery,
          where: normalizedLocation,
          results_per_page: limit
        }
      });

      if (adzunaResponse.data?.results) {
        jobs.push(...adzunaResponse.data.results.map(job => ({
          jobId: job.id.toString(),
          title: job.title,
          company: job.company?.display_name || 'Unknown',
          location: job.location?.display_name || normalizedLocation,
          salary: {
            min: job.salary_min,
            max: job.salary_max,
            currency: job.salary_currency || 'GBP'
          },
          employmentType: job.contract_type,
          remoteWork: false,
          description: job.description,
          applyUrl: job.redirect_url,
          source: 'Adzuna',
          postedDate: job.created,
          skills: []
        })));
      }
    }

    // JobDataLake API placeholder
    if (process.env.JOBDATALAKE_API_KEY) {
      try {
        const lakeResponse = await axios.get('https://api.jobdatalake.com/jobs', {
          params: {
            api_key: process.env.JOBDATALAKE_API_KEY,
            query: normalizedQuery,
            location: normalizedLocation,
            size: limit
          }
        });

        if (lakeResponse.data?.jobs) {
          jobs.push(...lakeResponse.data.jobs.map(job => ({
            jobId: job.id?.toString() || `${job.title}-${Math.random()}`,
            title: job.title,
            company: job.company,
            location: job.location,
            salary: job.salary || {},
            employmentType: job.type,
            remoteWork: job.remote || false,
            description: job.description,
            applyUrl: job.apply_url,
            source: 'JobDataLake',
            postedDate: job.posted_date,
            skills: job.skills || []
          })));
        }
      } catch (lakeError) {
        console.warn('JobDataLake fetch skipped or failed:', lakeError.message);
      }
    }
  } catch (error) {
    console.error('Error fetching jobs:', error);
  }

  const uniqueJobs = jobs.reduce((acc, job) => {
    if (!acc.some(existing => existing.jobId === job.jobId)) {
      acc.push(job);
    }
    return acc;
  }, []);

  return uniqueJobs.slice(0, limit);
};

// Get job recommendations for user
router.get('/recommendations/:userId', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check access
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user's skills and preferences
    const userSkills = user.profile?.skills || [];
    const userLocation = user.preferences?.location || '';
    const query = userSkills.join(' ') || 'software developer';

    // Fetch jobs
    const jobs = await fetchJobsFromAPIs(query, userLocation, 20);

    // Send to AI service for recommendations
    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/recommend-jobs`, {
      userProfile: user.profile,
      jobs: jobs
    });

    const recommendations = aiResponse.data.recommendations;

    // Refresh stored recommendations for this user
    await Recommendation.deleteMany({ userId: user._id });
    const savedRecommendations = await Recommendation.insertMany(
      recommendations.map(rec => ({
        userId: user._id,
        ...rec
      }))
    );

    res.json({
      recommendations: savedRecommendations,
      jobs: jobs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error getting recommendations' });
  }
});

// Save a job
router.post('/save', require('../middleware/auth'), async (req, res) => {
  try {
    const { jobId, title, company, location, salary, employmentType, applyUrl, source } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const alreadySaved = user.savedJobs.some(job => job.jobId === jobId);
    if (alreadySaved) {
      return res.status(400).json({ error: 'Job already saved' });
    }

    user.savedJobs.push({
      jobId,
      title,
      company,
      location,
      salary,
      employmentType,
      applyUrl,
      source,
      savedAt: new Date()
    });

    await user.save();

    res.json({ message: 'Job saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error saving job' });
  }
});

// Remove a saved job
router.delete('/save/:jobId', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.savedJobs = user.savedJobs.filter(job => job.jobId !== req.params.jobId);
    await user.save();

    res.json({ message: 'Saved job removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error removing saved job' });
  }
});

// Get saved jobs
router.get('/saved/:userId', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('savedJobs');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(user.savedJobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search jobs
router.get('/search', async (req, res) => {
  try {
    const { query, location, limit = 10 } = req.query;
    const jobs = await fetchJobsFromAPIs(query, location, parseInt(limit));
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error searching jobs' });
  }
});

// Get career advice
router.post('/career-advice', require('../middleware/auth'), async (req, res) => {
  try {
    const { careerGoals } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/career-advice`, {
      userProfile: user.profile,
      careerGoals
    });

    res.json(aiResponse.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error getting career advice' });
  }
});

// Get resume feedback
router.post('/resume-feedback', require('../middleware/auth'), async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get resume text (this would need to be stored or retrieved)
    // For now, we'll use a placeholder or reconstruct from profile
    const resumeText = JSON.stringify(user.profile);

    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/resume-feedback`, {
      resumeText,
      jobDescription
    });

    res.json(aiResponse.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error getting resume feedback' });
  }
});

// Get interview preparation
router.post('/interview-prep', require('../middleware/auth'), async (req, res) => {
  try {
    const { jobTitle } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/interview-prep`, {
      jobTitle,
      userProfile: user.profile
    });

    res.json(aiResponse.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error getting interview preparation' });
  }
});

// Get course recommendations
router.post('/course-recommendations', require('../middleware/auth'), async (req, res) => {
  try {
    const { targetSkills } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/course-recommendations`, {
      userProfile: user.profile,
      targetSkills: targetSkills || []
    });

    res.json(aiResponse.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error getting course recommendations' });
  }
});

module.exports = router;
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const axios = require('axios');
const User = require('../models/User');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../resumes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|docx|doc/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed!'));
    }
  }
});

// Extract text from PDF
const extractTextFromPDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

// Extract text from DOCX
const extractTextFromDOCX = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
};

// Upload resume
router.post('/upload', require('../middleware/auth'), upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    let text = '';
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    // Extract text based on file type
    if (fileExt === '.pdf') {
      text = await extractTextFromPDF(filePath);
    } else if (fileExt === '.docx' || fileExt === '.doc') {
      text = await extractTextFromDOCX(filePath);
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Unable to extract text from the uploaded resume. Please upload a valid PDF or DOC/DOCX file.' });
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL;
    if (!aiServiceUrl) {
      throw new Error('AI_SERVICE_URL is not configured. Please set AI_SERVICE_URL in your environment.');
    }

    // Send text to AI service for parsing
    const aiResponse = await axios.post(`${aiServiceUrl}/parse-resume`, {
      text: text
    });

    const parsedData = aiResponse.data;

    // Validate and transform the parsed data to match the schema
    const profileData = {};
    
    // Handle skills
    if (parsedData.skills) {
      profileData.skills = Array.isArray(parsedData.skills) 
        ? parsedData.skills 
        : (typeof parsedData.skills === 'string' ? [parsedData.skills] : []);
    }
    
    // Handle experience - ensure it's an array of objects
    if (parsedData.experience) {
      profileData.experience = Array.isArray(parsedData.experience)
        ? parsedData.experience.map(exp => ({
            title: typeof exp === 'string' ? exp : (exp.title || ''),
            company: exp.company || '',
            duration: exp.duration || '',
            description: exp.description || ''
          }))
        : [];
    }
    
    // Handle education - convert string to object array
    if (parsedData.education) {
      if (Array.isArray(parsedData.education)) {
        profileData.education = parsedData.education.map(edu => {
          if (typeof edu === 'string') {
            // Try to parse education string
            return {
              degree: edu,
              institution: '',
              year: null
            };
          }
          return {
            degree: edu.degree || '',
            institution: edu.institution || '',
            year: edu.year || null
          };
        });
      } else if (typeof parsedData.education === 'string') {
        // Single education string - convert to array
        profileData.education = [{
          degree: parsedData.education,
          institution: '',
          year: null
        }];
      }
    }
    
    // Handle certifications
    if (parsedData.certifications) {
      profileData.certifications = Array.isArray(parsedData.certifications)
        ? parsedData.certifications
        : (typeof parsedData.certifications === 'string' ? [parsedData.certifications] : []);
    }
    
    // Handle interests
    if (parsedData.interests) {
      profileData.interests = Array.isArray(parsedData.interests)
        ? parsedData.interests
        : (typeof parsedData.interests === 'string' ? [parsedData.interests] : []);
    }

    // Validate userId
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Unauthorized: Invalid user session' });
    }

    // Update user profile with parsed data
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        profile: profileData,
        resume: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          uploadedAt: new Date()
        }
      },
      { new: true, runValidators: false }
    ).select('-password');

    res.json({
      message: 'Resume uploaded and parsed successfully',
      user: user
    });
  } catch (error) {
    console.error('Resume upload error:', error.response ? error.response.data : error.message);
    const responseData = error.response?.data;
    const message = responseData?.error
      || responseData?.detail
      || (typeof responseData === 'string' ? responseData : undefined)
      || error.message
      || 'Error processing resume';
    res.status(500).json({ error: message });
  }
});

// Get user's resume data
router.get('/:userId', require('../middleware/auth'), async (req, res) => {
  try {
    // Validate userId
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Unauthorized: Invalid user session' });
    }

    // Ensure the userId in params matches the authenticated user
    if (req.user.userId.toString() !== req.params.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findById(req.params.userId).select('profile resume');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
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

    // Extract text based on file type
    if (req.file.mimetype === 'application/pdf') {
      text = await extractTextFromPDF(filePath);
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = await extractTextFromDOCX(filePath);
    }

    // Send text to AI service for parsing
    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/parse-resume`, {
      text: text
    });

    const parsedData = aiResponse.data;

    // Update user profile with parsed data
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        profile: parsedData,
        resume: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: req.file.path,
          uploadedAt: new Date()
        }
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Resume uploaded and parsed successfully',
      user: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing resume' });
  }
});

// Get user's resume data
router.get('/:userId', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('profile resume');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user can access this data
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
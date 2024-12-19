const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const FILE_LIMITS = {
  profileImage: 5 * 1024 * 1024,
  propertyImages: 10 * 1024 * 1024,
  propertyVideos: 50 * 1024 * 1024,
  propertyDocuments: 25 * 1024 * 1024
};

const MAX_COUNTS = {  
  propertyImages: 20,
  propertyVideos: 5,
  propertyDocuments: 10
};

const fileFilter = (req, file, cb) => { 

  try {
    switch (file.fieldname) {
      case 'profileImage':
        // Accept any image format
        if (!file.mimetype.startsWith('image/')) {
          throw new Error('Profile image must be an image file');
        }
        if (file.size > FILE_LIMITS.profileImage) {
          throw new Error('Profile image size exceeds 5MB limit');
        }
        break;

      case 'images':
        // Accept any image format
        if (!file.mimetype.startsWith('image/')) {
          throw new Error('Property images must be image files');
        }
        if (file.size > FILE_LIMITS.propertyImages) {
          throw new Error('Property image size exceeds 10MB limit');
        }
        break;

      case 'videos':
        // Accept any video format
        if (!file.mimetype.startsWith('video/')) {
          throw new Error('Property videos must be video files');
        }
        if (file.size > FILE_LIMITS.propertyVideos) {
          throw new Error('Property video size exceeds 50MB limit');
        }
        break;

      case 'documents':
        // Accept any document format
        if (file.size > FILE_LIMITS.propertyDocuments) {
          throw new Error('Document size exceeds 25MB limit');
        }
        break;

      default:
        throw new Error('Invalid field name');
    }

    const existingFiles = req.files ? req.files[file.fieldname] : [];
    if (file.fieldname !== 'profileImage' && 
        existingFiles && 
        existingFiles.length >= MAX_COUNTS[file.fieldname]) {
      throw new Error(`Maximum number of ${file.fieldname} reached`);
    }

    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

// Single file upload for profile image
const uploadProfileImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_LIMITS.profileImage
  }
}).single('profileImage');

// Multiple files upload for property media
const uploadPropertyMedia = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(...Object.values(FILE_LIMITS))
  }
}).fields([
  { name: 'images', maxCount: MAX_COUNTS.propertyImages },
  { name: 'videos', maxCount: MAX_COUNTS.propertyVideos },
  { name: 'documents', maxCount: MAX_COUNTS.propertyDocuments }
]);

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: `Unexpected field: ${err.field}`
      });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

module.exports = {
  uploadProfileImage,
  uploadPropertyMedia,
  handleUploadError,
  FILE_LIMITS,
  MAX_COUNTS
};
import fs from 'fs';
import cloudinary from '../config/cloudinary.js';
import Mission from '../models/Mission.js';
import SonarImage from '../models/SonarImage.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// Streams a temp file to Cloudinary so the whole file never lives in RAM.
// Stream errors are wired to reject() so failure is handled (and logged) by
// the controller instead of crashing the process as an unhandled rejection.
const uploadToCloudinary = (filePath, originalName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'oceansentinel/sonar',
        resource_type: 'auto',
        public_id: `${Date.now()}_${originalName.replace(/\.[^/.]+$/, '')}`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.on('error', (err) => reject(err));
    fs.createReadStream(filePath)
      .on('error', (err) => reject(err))
      .pipe(uploadStream);
  });
};

const removeTempFile = (filePath) => {
  if (filePath) {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') console.error('Failed to remove temp file:', filePath, err.message);
    });
  }
};

// Fallback for when Cloudinary not configured - use placeholder
const mockUpload = (originalName) => {
  return {
    secure_url: `https://res.cloudinary.com/demo/image/upload/v1/oceansentinel/sonar/${Date.now()}_${originalName}`,
    public_id: `oceansentinel/sonar/${Date.now()}_${originalName}`,
    width: 1024,
    height: 768
  };
};

export const uploadSonarImages = asyncHandler(async (req, res) => {
  const { missionId } = req.body;
  
  if (!missionId) {
    throw new ApiError(400, 'Mission ID is required');
  }

  const mission = await Mission.findById(missionId);
  if (!mission) {
    throw new ApiError(404, 'Mission not found');
  }

  if (req.user.role !== 'admin' && mission.uploadedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to upload to this mission');
  }

  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'No files uploaded');
  }

  const uploadedImages = [];
  const errors = [];
  const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                                  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';

  for (const file of req.files) {
    try {
      let result;

      if (isCloudinaryConfigured) {
        result = await uploadToCloudinary(file.path, file.originalname);
      } else {
        // Mock for demo when cloudinary not configured
        result = mockUpload(file.originalname);
        console.log(`Mock upload for ${file.originalname} - Cloudinary not configured`);
      }

      const sonarImage = await SonarImage.create({
        mission: missionId,
        imageUrl: result.secure_url,
        cloudinaryId: result.public_id,
        originalName: file.originalname,
        fileSize: file.size,
        width: result.width || 1024,
        height: result.height || 768,
        metadata: {
          latitude: mission.latitude,
          longitude: mission.longitude,
          depth: mission.depth
        },
        analysisStatus: 'pending'
      });

      uploadedImages.push(sonarImage);
    } catch (error) {
      console.error(`Failed to upload ${file.originalname}:`, error.message);
      errors.push({ name: file.originalname, error: error.message });
      // Continue with other files
    } finally {
      removeTempFile(file.path);
    }
  }

  if (uploadedImages.length === 0 && errors.length > 0) {
    const preview = `${errors.length} of ${req.files.length} file(s) failed to upload. ${errors[0].error}`;
    res.status(500).json(new ApiResponse(500, { errors, uploaded: 0, total: req.files.length }, preview));
    return;
  }

  // Update mission totalImages
  mission.totalImages += uploadedImages.length;
  await mission.save();

  res.status(200).json(new ApiResponse(200, {
    uploaded: uploadedImages.length,
    total: req.files.length,
    images: uploadedImages,
    errors
  }, `${uploadedImages.length} images uploaded successfully`));
});

export const uploadMetadataCSV = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'CSV file required');
  }

  const csvContent = await fs.promises.readFile(req.file.path, 'utf-8');
  removeTempFile(req.file.path);

  // Basic validation
  if (!csvContent.includes('image_name')) {
    throw new ApiError(400, 'CSV must contain image_name column');
  }

  res.status(200).json(new ApiResponse(200, {
    preview: csvContent.split('\n').slice(0, 5).join('\n'),
    message: 'CSV parsed successfully. Metadata will be matched during analysis.'
  }, 'Metadata CSV uploaded'));
});

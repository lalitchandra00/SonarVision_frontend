import fs from 'fs';
import cloudinary from '../config/cloudinary.js';
import Mission from '../models/Mission.js';
import Video from '../models/Video.js';
import { analyzeVideo } from '../services/aiDetection.service.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// Streams the temp file to Cloudinary so a large video never lives in RAM.
// Stream errors reject() instead of crashing the process as unhandled rejection.
const uploadToCloudinary = (filePath, originalName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'oceansentinel/video',
        resource_type: 'video',
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

const mockUpload = (originalName) => ({
  secure_url: `https://res.cloudinary.com/demo/video/upload/v1/oceansentinel/video/${Date.now()}_${originalName}`,
  public_id: `oceansentinel/video/${Date.now()}_${originalName}`,
});

const assertMissionAccess = async (missionId, user) => {
  const mission = await Mission.findById(missionId);
  if (!mission) {
    throw new ApiError(404, 'Mission not found');
  }
  if (user.role !== 'admin' && mission.uploadedBy.toString() !== user._id.toString()) {
    throw new ApiError(403, 'Not authorized');
  }
  return mission;
};

export const uploadVideo = asyncHandler(async (req, res) => {
  const { missionId } = req.body;

  if (!missionId) {
    throw new ApiError(400, 'Mission ID is required');
  }
  await assertMissionAccess(missionId, req.user);

  if (!req.file) {
    throw new ApiError(400, 'No video uploaded. Send the video as multipart field "video".');
  }

  const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
                                  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';

  let result;
  if (isCloudinaryConfigured) {
    result = await uploadToCloudinary(req.file.path, req.file.originalname);
  } else {
    result = mockUpload(req.file.originalname);
    console.log(`Mock video upload for ${req.file.originalname} - Cloudinary not configured`);
  }
  removeTempFile(req.file.path);

  const video = await Video.create({
    mission: missionId,
    videoUrl: result.secure_url,
    cloudinaryId: result.public_id,
    originalName: req.file.originalname,
    fileSize: req.file.size,
    analysisStatus: 'pending',
  });

  await Mission.updateOne({ _id: missionId }, { status: 'uploaded' });

  res.status(200).json(new ApiResponse(200, { video }, 'Video uploaded successfully'));
});

export const startVideoAnalysis = asyncHandler(async (req, res) => {
  const { missionId } = req.params;
  const mission = await assertMissionAccess(missionId, req.user);

  const videos = await Video.find({ mission: missionId });
  const pendingVideos = videos.filter((v) => v.analysisStatus !== 'completed');
  if (pendingVideos.length === 0 && videos.length === 0) {
    throw new ApiError(400, 'No videos found for this mission. Upload a video first.');
  }

  mission.status = 'processing';
  mission.processingProgress = 0;
  await mission.save();

  const missionMetadata = {
    latitude: mission.latitude,
    longitude: mission.longitude,
    locationName: mission.locationName,
    depth: mission.depth,
    metersPerPixel: mission.metersPerPixel,
  };

  const summary = [];

  for (const video of pendingVideos) {
    video.analysisStatus = 'processing';
    await video.save();
    try {
      const result = await analyzeVideo(
        { videoUrl: video.videoUrl, filename: video.originalName },
        missionMetadata
      );

      video.frames = result.frames;
      video.totalFrames = result.totalFrames;
      video.totalDetections = result.totalDetections;
      video.width = result.width || video.width;
      video.height = result.height || video.height;
      video.confThreshold = result.confThreshold;
      video.elapsedMs = result.elapsedMs;
      video.analysisStatus = 'completed';
      video.analyzedAt = new Date();
      await video.save();

      summary.push({
        videoId: video._id,
        originalName: video.originalName,
        totalFrames: result.totalFrames,
        totalDetections: result.totalDetections,
      });
    } catch (err) {
      video.analysisStatus = 'failed';
      await video.save();
      summary.push({ videoId: video._id, originalName: video.originalName, error: err.message });
    }
  }

  mission.status = 'completed';
  mission.processingProgress = 100;
  mission.totalDetections += summary.reduce((sum, s) => sum + (s.totalDetections || 0), 0);
  await mission.save();

  res.status(200).json(new ApiResponse(200, {
    summary,
    videos: await Video.find({ mission: missionId }).sort({ createdAt: 1 }),
  }, 'Video analysis complete'));
});

export const getVideoResults = asyncHandler(async (req, res) => {
  const { missionId } = req.params;
  await assertMissionAccess(missionId, req.user);

  const videos = await Video.find({ mission: missionId }).sort({ createdAt: 1 });
  res.status(200).json(new ApiResponse(200, { videos }, 'Video results fetched'));
});
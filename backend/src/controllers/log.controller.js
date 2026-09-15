import fs from 'fs';
import cloudinary from '../config/cloudinary.js';
import Mission from '../models/Mission.js';
import SonarLog from '../models/SonarLog.js';
import { analyzeLog } from '../services/aiDetection.service.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// Streams the temp file to Cloudinary so a large .xtf never lives in RAM.
// Stream errors reject() instead of crashing the process as unhandled rejection.
const uploadToCloudinary = (filePath, originalName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'oceansentinel/log',
        resource_type: 'raw',
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
  secure_url: `https://res.cloudinary.com/demo/raw/upload/v1/oceansentinel/log/${Date.now()}_${originalName}`,
  public_id: `oceansentinel/log/${Date.now()}_${originalName}`,
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

export const uploadLogFile = asyncHandler(async (req, res) => {
  const { missionId } = req.body;

  if (!missionId) {
    throw new ApiError(400, 'Mission ID is required');
  }
  await assertMissionAccess(missionId, req.user);

  if (!req.file) {
    throw new ApiError(400, 'No log file uploaded. Send the .xtf/.jsf file as multipart field "log".');
  }

  const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
                                  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';

  let result;
  if (isCloudinaryConfigured) {
    result = await uploadToCloudinary(req.file.path, req.file.originalname);
  } else {
    result = mockUpload(req.file.originalname);
    console.log(`Mock log upload for ${req.file.originalname} - Cloudinary not configured`);
  }
  removeTempFile(req.file.path);

  const log = await SonarLog.create({
    mission: missionId,
    logUrl: result.secure_url,
    cloudinaryId: result.public_id,
    originalName: req.file.originalname,
    fileSize: req.file.size,
    analysisStatus: 'pending',
  });

  await Mission.updateOne({ _id: missionId }, { status: 'uploaded' });

  res.status(200).json(new ApiResponse(200, { log }, 'Sonar log uploaded successfully'));
});

export const startLogAnalysis = asyncHandler(async (req, res) => {
  const { missionId } = req.params;
  const mission = await assertMissionAccess(missionId, req.user);

  const logs = await SonarLog.find({ mission: missionId });
  const pendingLogs = logs.filter((l) => l.analysisStatus !== 'completed');
  if (pendingLogs.length === 0 && logs.length === 0) {
    throw new ApiError(400, 'No log files found for this mission. Upload a .xtf/.jsf log first.');
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

  for (const log of pendingLogs) {
    log.analysisStatus = 'processing';
    await log.save();
    try {
      const result = await analyzeLog(
        { logUrl: log.logUrl, filename: log.originalName },
        missionMetadata
      );

      log.strips = result.strips;
      log.tiles = result.tiles;
      log.detections = result.detections;
      log.totalDetections = result.totalDetections;
      log.confThreshold = result.confThreshold;
      log.elapsedMs = result.elapsedMs;
      log.analysisStatus = 'completed';
      log.analyzedAt = new Date();
      await log.save();

      summary.push({
        logId: log._id,
        originalName: log.originalName,
        totalDetections: result.totalDetections,
        strips: result.strips.length,
        tiles: result.tiles.length,
      });
    } catch (err) {
      log.analysisStatus = 'failed';
      await log.save();
      summary.push({ logId: log._id, originalName: log.originalName, error: err.message });
    }
  }

  mission.status = 'completed';
  mission.processingProgress = 100;
  mission.totalDetections += summary.reduce((sum, s) => sum + (s.totalDetections || 0), 0);
  await mission.save();

  res.status(200).json(new ApiResponse(200, {
    summary,
    logs: await SonarLog.find({ mission: missionId }).sort({ createdAt: 1 }),
  }, 'Sonar log analysis complete'));
});

export const getLogResults = asyncHandler(async (req, res) => {
  const { missionId } = req.params;
  await assertMissionAccess(missionId, req.user);

  const logs = await SonarLog.find({ mission: missionId }).sort({ createdAt: 1 });
  res.status(200).json(new ApiResponse(200, { logs }, 'Sonar log results fetched'));
});
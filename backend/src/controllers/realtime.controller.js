import fs from 'fs';
import { analyzeRealtimeFrame } from '../services/aiDetection.service.js';
import { calculateHazardScore, getHazardLevel, getConfidenceLabel } from '../services/hazardScore.service.js';
import Mission from '../models/Mission.js';
import RealtimeFrame from '../models/RealtimeFrame.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const NATURAL_TYPES = ['Rock', 'Sand Ripple', 'Natural Ridge'];

const normalizeBoundingBox = (bbox) => {
  if (Array.isArray(bbox)) {
    const [x1, y1, x2, y2] = bbox;
    return { x: x1, y: y1, width: (x2 - x1) || 1, height: (y2 - y1) || 1 };
  }
  const box = bbox || {};
  if ('width' in box && 'height' in box) return box;
  if ('x1' in box) return { x: box.x1, y: box.y1, width: (box.x2 - box.x1) || 1, height: (box.y2 - box.y1) || 1 };
  return { x: box.x || 0, y: box.y || 0, width: box.width || 1, height: box.height || 1 };
};

const removeTempFile = (filePath) => {
  if (filePath) {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') console.error('Failed to remove temp file:', filePath, err.message);
    });
  }
};

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

/**
 * Enriches a raw realtime detection with hazard scoring + hazard level so the
 * recorded frame carries the same quality data as mission detections.
 */
const enrichRealtimeDetection = (det, mission) => {
  const objectType = det.objectType || 'Unknown Debris';
  const confidence = det.confidence ?? 0;
  const box = normalizeBoundingBox(det.boundingBox || det.bbox);

  const hazardScore = calculateHazardScore({
    objectType,
    confidence,
    width: box.width || 0,
    length: box.height || 0,
    locationName: mission.locationName,
    depth: mission.depth,
  });

  return {
    objectType,
    confidence,
    confidenceLabel: getConfidenceLabel(confidence),
    class_id: det.class_id ?? det.class ?? det.classId,
    boundingBox: { x: box.x || 0, y: box.y || 0, width: box.width || 0, height: box.height || 0 },
    hazardScore,
    hazardLevel: getHazardLevel(hazardScore),
    isAnomaly: !NATURAL_TYPES.includes(objectType),
  };
};

/**
 * Realtime prediction: the frontend captures a webcam frame every ~3 seconds
 * and posts it here. We forward the frame straight to /predict/realtime and
 * return the rich result (detections + annotated_image_url) immediately.
 */
export const predictRealtimeFrame = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No frame uploaded. Send the captured webcam frame as multipart field "file".');
  }

  try {
    const buffer = await fs.promises.readFile(req.file.path);
    const result = await analyzeRealtimeFrame(buffer, req.file.originalname || 'frame.png');
    res.status(200).json(new ApiResponse(200, result, 'Realtime prediction complete'));
  } finally {
    removeTempFile(req.file.path);
  }
});

/**
 * Records a single analyzed frame against a mission. Persists the frame +
 * enriched detections and rolls counters back up into the mission doc so the
 * mission shows up in history with real, aggregated detection figures.
 */
export const recordRealtimeFrame = asyncHandler(async (req, res) => {
  const { missionId } = req.params;
  const { annotatedImageUrl, width, height, elapsedMs, detections = [] } = req.body;

  const mission = await assertMissionAccess(missionId, req.user);

  const enriched = detections.map((d) => enrichRealtimeDetection(d, mission));

  const frame = await RealtimeFrame.create({
    mission: mission._id,
    uploadedBy: req.user._id,
    frameIndex: mission.realtimeFrames + 1,
    annotatedImageUrl,
    width,
    height,
    elapsedMs,
    detections: enriched,
  });

  const critical = enriched.filter((d) => d.hazardLevel === 'CRITICAL').length;
  const high = enriched.filter((d) => d.hazardLevel === 'HIGH').length;

  await Mission.findByIdAndUpdate(mission._id, {
    $inc: {
      realtimeFrames: 1,
      totalDetections: enriched.length,
      criticalCount: critical,
      highCount: high,
    },
    $set: mission.status === 'uploaded' ? { status: 'processing' } : {},
  });

  res.status(201).json(new ApiResponse(201, { frame }, 'Frame recorded'));
});

/**
 * Lists all recorded realtime frames for a mission (used by analysis/history view).
 */
export const getRealtimeFrames = asyncHandler(async (req, res) => {
  const { missionId } = req.params;
  await assertMissionAccess(missionId, req.user);

  const frames = await RealtimeFrame.find({ mission: missionId }).sort({ timestamp: -1 });
  res.status(200).json(new ApiResponse(200, { frames }, 'Realtime frames fetched'));
});

/**
 * Marks the realtime session complete once the user stops the stream.
 */
export const endRealtimeSession = asyncHandler(async (req, res) => {
  const { missionId } = req.params;
  const mission = await assertMissionAccess(missionId, req.user);

  mission.status = 'completed';
  mission.processingProgress = 100;
  await mission.save();

  res.status(200).json(new ApiResponse(200, { mission }, 'Realtime session completed'));
});
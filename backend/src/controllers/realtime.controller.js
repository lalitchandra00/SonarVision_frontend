import fs from 'fs';
import { analyzeRealtimeFrame } from '../services/aiDetection.service.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const removeTempFile = (filePath) => {
  if (filePath) {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') console.error('Failed to remove temp file:', filePath, err.message);
    });
  }
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
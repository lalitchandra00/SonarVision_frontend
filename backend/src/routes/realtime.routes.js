import express from 'express';
import { predictRealtimeFrame, recordRealtimeFrame, getRealtimeFrames, endRealtimeSession } from '../controllers/realtime.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { uploadSingle, cleanupUploadedFiles } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/predict', uploadSingle, cleanupUploadedFiles, predictRealtimeFrame);
router.post('/:missionId/record', recordRealtimeFrame);
router.get('/:missionId/frames', getRealtimeFrames);
router.post('/:missionId/end', endRealtimeSession);

export default router;
import express from 'express';
import { predictRealtimeFrame } from '../controllers/realtime.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { uploadSingle, cleanupUploadedFiles } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/predict', uploadSingle, cleanupUploadedFiles, predictRealtimeFrame);

export default router;
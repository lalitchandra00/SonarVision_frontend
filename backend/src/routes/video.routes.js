import express from 'express';
import { uploadVideo, startVideoAnalysis, getVideoResults } from '../controllers/video.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { uploadVideo as uploadVideoMiddleware, cleanupUploadedFiles } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/upload', uploadVideoMiddleware, cleanupUploadedFiles, uploadVideo);
router.post('/:missionId/start', startVideoAnalysis);
router.get('/:missionId', getVideoResults);

export default router;
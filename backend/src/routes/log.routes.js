import express from 'express';
import { uploadLogFile, startLogAnalysis, getLogResults } from '../controllers/log.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { uploadLog as uploadLogMiddleware, cleanupUploadedFiles } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/upload', uploadLogMiddleware, cleanupUploadedFiles, uploadLogFile);
router.post('/:missionId/start', startLogAnalysis);
router.get('/:missionId', getLogResults);

export default router;
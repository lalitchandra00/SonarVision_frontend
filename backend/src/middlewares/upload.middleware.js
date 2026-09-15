import multer from 'multer';
import path from 'path';
import os from 'os';
import fs from 'fs';
import crypto from 'crypto';

// All uploads land on disk first (temp dir) and are streamed to Cloudinary /
// the prediction service. Using memory storage risks the Node process being
// killed (OOM) when several large files arrive at once, which resets the
// socket and drops the whole connection mid-request.
const tempDir = path.join(os.tmpdir(), 'oceansentinel-uploads');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  }
});

const imageFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/tiff',
    'image/tif',
    'application/zip',
    'application/x-zip-compressed',
    'text/csv',
    'application/vnd.ms-excel'
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.zip', '.csv'];

  if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPG, PNG, TIFF, ZIP, CSV`), false);
  }
};

const upload = multer({
  storage: diskStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 20
  }
});

export const uploadSonarImages = upload.array('sonarImages', 20);
export const uploadSingle = upload.single('file');
export const uploadMetadataCSV = upload.single('metadata');

// ---- Video upload (frontend sends video -> backend stores -> /predict/video) ----
const videoFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
  const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm', 'video/x-m4v'];
  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported video format: ${file.mimetype}. Allowed: MP4, MOV, AVI, MKV, WEBM`), false);
  }
};

const uploadVideoMulter = multer({
  storage: diskStorage,
  fileFilter: videoFilter,
  limits: { fileSize: 300 * 1024 * 1024 } // 300MB
});

// ---- Sonar log upload (.xtf/.jsf -> /predict/log) ----
const logFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.xtf', '.jsf', '.sdf'];
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported sonar log format: ${file.originalname}. Allowed: XTF, JSF, SDF`), false);
  }
};

const uploadLogMulter = multer({
  storage: diskStorage,
  fileFilter: logFilter,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

export const uploadVideo = uploadVideoMulter.single('video');
export const uploadLog = uploadLogMulter.single('log');

// Safety net: wipes any temp file multer wrote if the controller fails before
// its own cleanup runs (e.g. validation error after the files hit disk).
export const cleanupUploadedFiles = (req, res, next) => {
  const cleanup = () => {
    const files = Array.isArray(req.files) ? req.files : req.file ? [req.file] : [];
    for (const f of files) {
      if (f?.path) {
        fs.unlink(f.path, () => {});
      }
    }
  };
  res.once('finish', cleanup);
  res.once('close', cleanup);
  next();
};

export default upload;
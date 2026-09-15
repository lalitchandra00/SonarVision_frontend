import mongoose from 'mongoose';

const videoDetectionSchema = new mongoose.Schema({
  objectType: String,
  confidence: Number,
  confidenceLabel: String,
  boundingBox: { x: Number, y: Number, width: Number, height: Number },
  estimatedWidthMeters: Number,
  estimatedLengthMeters: Number,
  hazardScore: Number,
  hazardLevel: String,
  aiInterpretation: String,
  recommendation: String,
  isAnomaly: Boolean,
}, { _id: false });

const videoFrameSchema = new mongoose.Schema({
  index: Number,
  timestamp: mongoose.Schema.Types.Mixed,
  timeOffsetSec: Number,
  url: String,
  images: [String],
  detections: [videoDetectionSchema],
}, { _id: false });

const videoSchema = new mongoose.Schema({
  mission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    required: true,
    index: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  cloudinaryId: String,
  originalName: {
    type: String,
    required: true
  },
  fileSize: Number,
  analysisStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  width: Number,
  height: Number,
  totalFrames: Number,
  totalDetections: {
    type: Number,
    default: 0
  },
  confThreshold: Number,
  elapsedMs: Number,
  frames: [videoFrameSchema],
  analyzedAt: Date
}, {
  timestamps: true
});

videoSchema.index({ mission: 1, createdAt: -1 });

const Video = mongoose.model('Video', videoSchema);
export default Video;
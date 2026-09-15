import mongoose from 'mongoose';

const logDetectionSchema = new mongoose.Schema({
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

const sonarLogSchema = new mongoose.Schema({
  mission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    required: true,
    index: true
  },
  logUrl: {
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
  strips: [String],
  tiles: [String],
  detections: [logDetectionSchema],
  totalDetections: {
    type: Number,
    default: 0
  },
  confThreshold: Number,
  elapsedMs: Number,
  analyzedAt: Date
}, {
  timestamps: true
});

sonarLogSchema.index({ mission: 1, createdAt: -1 });

const SonarLog = mongoose.model('SonarLog', sonarLogSchema);
export default SonarLog;
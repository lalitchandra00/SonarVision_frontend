import mongoose from 'mongoose';

const realtimeDetectionSchema = new mongoose.Schema({
  objectType: String,
  confidence: Number,
  confidenceLabel: String,
  class_id: Number,
  boundingBox: {
    x: Number,
    y: Number,
    width: Number,
    height: Number
  },
  hazardScore: Number,
  hazardLevel: String,
  isAnomaly: Boolean
}, { _id: false });

const realtimeFrameSchema = new mongoose.Schema({
  mission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    required: true,
    index: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  frameIndex: Number,
  timestamp: {
    type: Date,
    default: Date.now
  },
  annotatedImageUrl: String,
  width: Number,
  height: Number,
  elapsedMs: Number,
  detections: [realtimeDetectionSchema]
}, {
  timestamps: true
});

realtimeFrameSchema.index({ mission: 1, timestamp: -1 });

const RealtimeFrame = mongoose.model('RealtimeFrame', realtimeFrameSchema);
export default RealtimeFrame;
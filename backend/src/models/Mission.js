import mongoose from 'mongoose';

const missionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  locationName: {
    type: String,
    required: true,
    trim: true
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  depth: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['Ship', 'AUV', 'ROV'],
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'completed', 'failed'],
    default: 'uploaded'
  },
  sourceType: {
    type: String,
    enum: ['sonar', 'video', 'log', 'realtime'],
    default: 'sonar'
  },
  realtimeFrames: {
    type: Number,
    default: 0
  },
  totalImages: {
    type: Number,
    default: 0
  },
  totalDetections: {
    type: Number,
    default: 0
  },
  criticalCount: {
    type: Number,
    default: 0
  },
  highCount: {
    type: Number,
    default: 0
  },
  processingProgress: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

missionSchema.index({ uploadedBy: 1, createdAt: -1 });
missionSchema.index({ status: 1 });
missionSchema.index({ latitude: 1, longitude: 1 });

const Mission = mongoose.model('Mission', missionSchema);
export default Mission;

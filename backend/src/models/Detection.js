import mongoose from 'mongoose';

const detectionSchema = new mongoose.Schema({
  mission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    required: true,
    index: true
  },
  sonarImage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SonarImage',
    required: true
  },
  objectType: {
    type: String,
    enum: ['Ghost Net', 'Pipe', 'Cylinder', 'Shipwreck', 'Unknown Debris', 'Rock', 'Sand Ripple', 'Natural Ridge', 'Plane', 'Human'],
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  confidenceLabel: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Very High']
  },
  boundingBox: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  estimatedWidthMeters: {
    type: Number,
    required: true
  },
  estimatedLengthMeters: {
    type: Number,
    required: true
  },
  estimatedArea: {
    type: Number
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  depth: Number,
  hazardScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  hazardLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true
  },
  isAnomaly: {
    type: Boolean,
    default: true
  },
  isFiltered: {
    type: Boolean,
    default: false
  },
  aiInterpretation: {
    type: String
  },
  recommendation: {
    type: String
  },
  imageName: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

detectionSchema.index({ hazardLevel: 1 });
detectionSchema.index({ objectType: 1 });
detectionSchema.index({ mission: 1, hazardLevel: 1 });
detectionSchema.index({ latitude: 1, longitude: 1 });

const Detection = mongoose.model('Detection', detectionSchema);
export default Detection;

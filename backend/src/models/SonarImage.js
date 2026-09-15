import mongoose from 'mongoose';

const sonarImageSchema = new mongoose.Schema({
  mission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  annotatedImageUrl: {
    type: String
  },
  cloudinaryId: {
    type: String
  },
  originalName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  metadata: {
    timestamp: Date,
    latitude: Number,
    longitude: Number,
    depth: Number,
    heading: Number,
    altitude: Number,
    frequency: Number,
    range: Number
  },
  analysisStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  width: Number,
  height: Number
}, {
  timestamps: true
});

sonarImageSchema.index({ mission: 1 });

const SonarImage = mongoose.model('SonarImage', sonarImageSchema);
export default SonarImage;

import Mission from '../models/Mission.js';
import SonarImage from '../models/SonarImage.js';
import Detection from '../models/Detection.js';
import RealtimeFrame from '../models/RealtimeFrame.js';
import { analyzeMission } from '../services/aiDetection.service.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const startAnalysis = asyncHandler(async (req, res) => {
  const { missionId } = req.params;

  const mission = await Mission.findById(missionId);
  if (!mission) {
    throw new ApiError(404, 'Mission not found');
  }

  if (req.user.role !== 'admin' && mission.uploadedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized');
  }

  const images = await SonarImage.find({ mission: missionId });
  if (images.length === 0) {
    throw new ApiError(400, 'No images found for this mission. Upload sonar images first.');
  }

  // Set to processing
  mission.status = 'processing';
  mission.processingProgress = 0;
  await mission.save();

  // Update images to processing
  await SonarImage.updateMany({ mission: missionId }, { analysisStatus: 'processing' });

  // Simulate pipeline delay for realistic UX (in real app, this would be async job)
  // For prototype, we do immediate analysis but with progress simulation
  
  try {
    // Run mock AI analysis
    const result = await analyzeMission(images, mission);

    // Save detections to DB
    const detectionDocs = [];
    for (const det of result.detections) {
      const doc = await Detection.create({
        mission: mission._id,
        sonarImage: det.sonarImage,
        objectType: det.objectType,
        confidence: det.confidence,
        confidenceLabel: det.confidenceLabel,
        boundingBox: det.boundingBox,
        estimatedWidthMeters: det.estimatedWidthMeters,
        estimatedLengthMeters: det.estimatedLengthMeters,
        estimatedArea: det.estimatedArea,
        latitude: det.latitude,
        longitude: det.longitude,
        depth: det.depth,
        hazardScore: det.hazardScore,
        hazardLevel: det.hazardLevel,
        isAnomaly: det.isAnomaly,
        aiInterpretation: det.aiInterpretation,
        recommendation: det.recommendation,
        imageName: det.imageName,
        timestamp: det.timestamp
      });
      detectionDocs.push(doc);
    }

    // Persist annotated (boxed) image URL + model-reported dimensions back to each SonarImage
    for (const ann of result.annotatedImages || []) {
      if (!ann.imageId) continue;
      const update = { annotatedImageUrl: ann.annotatedImageUrl };
      if (ann.width) update.width = ann.width;
      if (ann.height) update.height = ann.height;
      try {
        await SonarImage.updateOne({ _id: ann.imageId }, { $set: update });
      } catch (err) {
        console.error(`Failed to attach annotated image for ${ann.imageId}:`, err.message);
      }
    }

    // Update mission stats
    mission.status = 'completed';
    mission.totalDetections = result.totalAnomalies;
    mission.criticalCount = result.detections.filter(d => d.hazardLevel === 'CRITICAL').length;
    mission.highCount = result.detections.filter(d => d.hazardLevel === 'HIGH').length;
    mission.processingProgress = 100;
    await mission.save();

    await SonarImage.updateMany({ mission: missionId }, { analysisStatus: 'completed' });

    res.status(200).json(new ApiResponse(200, {
      mission,
      summary: {
        totalImages: result.totalImages,
        totalRawDetections: result.totalRawDetections,
        totalAnomalies: result.totalAnomalies,
        critical: mission.criticalCount,
        high: mission.highCount
      },
      detections: detectionDocs
    }, 'Analysis completed successfully'));

  } catch (error) {
    mission.status = 'failed';
    await mission.save();
    await SonarImage.updateMany({ mission: missionId }, { analysisStatus: 'failed' });
    throw new ApiError(500, `Analysis failed: ${error.message}`);
  }
});

export const getAnalysisResults = asyncHandler(async (req, res) => {
  const { missionId } = req.params;

  const mission = await Mission.findById(missionId).populate('uploadedBy', 'name email');
  if (!mission) {
    throw new ApiError(404, 'Mission not found');
  }

  if (req.user.role !== 'admin' && mission.uploadedBy._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized');
  }

  const [images, detections, frames] = await Promise.all([
    SonarImage.find({ mission: missionId }),
    Detection.find({ mission: missionId }).populate('sonarImage').sort({ hazardScore: -1 }),
    RealtimeFrame.find({ mission: missionId }).sort({ timestamp: -1 })
  ]);

  const frameDetections = frames.reduce((acc, f) => {
    (f.detections || []).forEach((d) => acc.push({ ...d, frameId: f._id, annotatedImageUrl: f.annotatedImageUrl, timestamp: f.timestamp }));
    return acc;
  }, []);

  const allDetections = [...detections, ...frameDetections];

  const stats = {
    total: allDetections.length,
    critical: allDetections.filter(d => d.hazardLevel === 'CRITICAL').length,
    high: allDetections.filter(d => d.hazardLevel === 'HIGH').length,
    medium: allDetections.filter(d => d.hazardLevel === 'MEDIUM').length,
    low: allDetections.filter(d => d.hazardLevel === 'LOW').length,
    byType: allDetections.reduce((acc, d) => {
      acc[d.objectType] = (acc[d.objectType] || 0) + 1;
      return acc;
    }, {}),
    avgConfidence: allDetections.length ? 
      Math.round((allDetections.reduce((s, d) => s + d.confidence, 0) / allDetections.length) * 100) / 100 : 0
  };

  res.status(200).json(new ApiResponse(200, {
    mission,
    images,
    detections,
    frames,
    stats
  }, 'Analysis results fetched'));
});

// Simulate pipeline status for frontend animation
export const getAnalysisStatus = asyncHandler(async (req, res) => {
  const { missionId } = req.params;
  const mission = await Mission.findById(missionId);
  
  if (!mission) throw new ApiError(404, 'Mission not found');

  const stages = [
    { id: 1, name: 'Uploading Sonar Data', status: 'completed', duration: 800 },
    { id: 2, name: 'Validating Files', status: 'completed', duration: 600 },
    { id: 3, name: 'Preprocessing Acoustic Image', status: 'completed', duration: 1200 },
    { id: 4, name: 'Reducing Speckle Noise', status: 'completed', duration: 1000 },
    { id: 5, name: 'Enhancing Contrast', status: 'completed', duration: 900 },
    { id: 6, name: 'Running AI Detection', status: mission.status === 'processing' ? 'processing' : 'completed', duration: 2500 },
    { id: 7, name: 'Filtering False Positives', status: mission.status === 'completed' ? 'completed' : 'pending', duration: 700 },
    { id: 8, name: 'Parsing Metadata', status: mission.status === 'completed' ? 'completed' : 'pending', duration: 500 },
    { id: 9, name: 'Geotagging Anomalies', status: mission.status === 'completed' ? 'completed' : 'pending', duration: 600 },
    { id: 10, name: 'Generating Report', status: mission.status === 'completed' ? 'completed' : 'pending', duration: 800 },
  ];

  res.status(200).json(new ApiResponse(200, {
    missionId,
    status: mission.status,
    progress: mission.processingProgress,
    stages
  }, 'Status fetched'));
});

import Mission from '../models/Mission.js';
import SonarImage from '../models/SonarImage.js';
import Detection from '../models/Detection.js';
import RealtimeFrame from '../models/RealtimeFrame.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const createMission = asyncHandler(async (req, res) => {
  const { name, locationName, latitude, longitude, depth, date, vehicleType, sourceType = 'sonar' } = req.body;

  if (!name || !locationName || !latitude || !longitude || !depth || !date || !vehicleType) {
    throw new ApiError(400, 'All mission fields are required');
  }

  const mission = await Mission.create({
    name,
    locationName,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    depth: parseFloat(depth),
    date: new Date(date),
    vehicleType,
    sourceType,
    uploadedBy: req.user._id,
    status: 'uploaded'
  });

  res.status(201).json(new ApiResponse(201, { mission }, 'Mission created successfully'));
});

export const getMissions = asyncHandler(async (req, res) => {
  const { search, status, hazardLevel, vehicleType, sortBy = 'createdAt', order = 'desc', page = 1, limit = 10 } = req.query;

  let query = {};
  
  // Researchers see only their missions, admins see all
  if (req.user.role !== 'admin') {
    query.uploadedBy = req.user._id;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { locationName: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) query.status = status;
  if (vehicleType) query.vehicleType = vehicleType;

  const sortOrder = order === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [missions, total] = await Promise.all([
    Mission.find(query).populate('uploadedBy', 'name email organization').sort(sort).skip(skip).limit(parseInt(limit)),
    Mission.countDocuments(query)
  ]);

  res.status(200).json(new ApiResponse(200, {
    missions,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    }
  }, 'Missions fetched'));
});

export const getMissionById = asyncHandler(async (req, res) => {
  const mission = await Mission.findById(req.params.id).populate('uploadedBy', 'name email organization');
  
  if (!mission) {
    throw new ApiError(404, 'Mission not found');
  }

  // Check ownership
  if (req.user.role !== 'admin' && mission.uploadedBy._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to access this mission');
  }

  const [images, detections, frames] = await Promise.all([
    SonarImage.find({ mission: mission._id }),
    Detection.find({ mission: mission._id }).sort({ hazardScore: -1 }),
    RealtimeFrame.find({ mission: mission._id }).sort({ timestamp: -1 })
  ]);

  res.status(200).json(new ApiResponse(200, {
    mission,
    images,
    detections,
    frames,
    stats: {
      totalImages: images.length,
      totalFrames: frames.length,
      totalDetections: detections.length + frames.reduce((s, f) => s + (f.detections?.length || 0), 0),
      critical: detections.filter(d => d.hazardLevel === 'CRITICAL').length,
      high: detections.filter(d => d.hazardLevel === 'HIGH').length
    }
  }, 'Mission details fetched'));
});

export const deleteMission = asyncHandler(async (req, res) => {
  const mission = await Mission.findById(req.params.id);
  
  if (!mission) {
    throw new ApiError(404, 'Mission not found');
  }

  if (req.user.role !== 'admin' && mission.uploadedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to delete this mission');
  }

  await Promise.all([
    SonarImage.deleteMany({ mission: mission._id }),
    Detection.deleteMany({ mission: mission._id }),
    RealtimeFrame.deleteMany({ mission: mission._id }),
    Mission.findByIdAndDelete(mission._id)
  ]);

  res.status(200).json(new ApiResponse(200, null, 'Mission deleted successfully'));
});

export const getMissionStats = asyncHandler(async (req, res) => {
  const userFilter = req.user.role === 'admin' ? {} : { uploadedBy: req.user._id };
  
  const [totalMissions, completedMissions, totalImagesAgg, totalDetections, criticalCount] = await Promise.all([
    Mission.countDocuments(userFilter),
    Mission.countDocuments({ ...userFilter, status: 'completed' }),
    Mission.aggregate([
      { $match: userFilter },
      { $group: { _id: null, total: { $sum: '$totalImages' } } }
    ]),
    Detection.countDocuments(req.user.role === 'admin' ? {} : { mission: { $in: await Mission.find(userFilter).distinct('_id') } }),
    Detection.countDocuments({ 
      hazardLevel: 'CRITICAL',
      ...(req.user.role !== 'admin' && { mission: { $in: await Mission.find(userFilter).distinct('_id') } })
    })
  ]);

  const totalImages = totalImagesAgg[0]?.total || 0;

  res.status(200).json(new ApiResponse(200, {
    totalMissions,
    completedMissions,
    totalImages,
    totalDetections,
    criticalCount
  }, 'Stats fetched'));
});

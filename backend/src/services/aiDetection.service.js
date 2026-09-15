/**
 * AI Detection Engine
 * Calls the real YOLO-based Side-Scan Sonar detection service (Python FastAPI)
 * and enriches raw model output with hazard scoring, geo-referencing, and
 * human-readable interpretation before it's stored/returned.
 *
 * SonarVision service endpoints (all multipart/form-data with a `file` field):
 *  - /predict/image     -> still sonar images
 *  - /predict/video     -> video files (samples 1 frame every 3 seconds)
 *  - /predict/realtime  -> single webcam-captured frame
 *  - /predict/log       -> .xtf/.jsf side-scan sonar logs
 */
import axios from 'axios';
import FormData from 'form-data';
import { calculateHazardScore, getHazardLevel, getConfidenceLabel, getAIInterpretation, getRecommendation } from './hazardScore.service.js';

const NATURAL_TYPES = ['Rock', 'Sand Ripple', 'Natural Ridge'];

const CONFIDENCE_THRESHOLD = 0.5;

// Confidence threshold sent to the SonarVision prediction API (?conf=)
const API_CONF_THRESHOLD = 0.7;

// Timeouts: images/frames are quick; video + log batch jobs can take minutes
const IMAGE_TIMEOUT = 120000;
const BATCH_TIMEOUT = 15 * 60 * 1000;

const randomFloat = (min, max) => Math.random() * (max - min) + min;
const round1 = (n) => Math.round(n * 10) / 10;
const round5 = (n) => Math.round(n * 100000) / 100000;

const mapYoloClassToObjectType = (yoloClass) => {
  const mapping = {
    ghost_net: 'Ghost Net',
    ghostnet: 'Ghost Net',
    pipe: 'Pipe',
    cylinder: 'Cylinder',
    shipwreck: 'Shipwreck',
    shipwrecks: 'Shipwreck',
    debris: 'Unknown Debris',
    rock: 'Rock',
    plane: 'Plane',
    human: 'Human',
  };
  return mapping[String(yoloClass || '').toLowerCase()] || 'Unknown Debris';
};

/**
 * Normalizes whatever bbox shape the model returns into { x, y, width, height }.
 * Accepts [x1, y1, x2, y2], or an already-shaped object ({x1,y1,x2,y2} | {x,y,width,height}).
 */
const normalizeBoundingBox = (bbox) => {
  let box;
  if (Array.isArray(bbox)) {
    const [x1, y1, x2, y2] = bbox;
    box = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
  } else if (bbox && 'width' in bbox && 'height' in bbox) {
    box = bbox;
  } else if (bbox && 'x1' in bbox) {
    box = { x: bbox.x1, y: bbox.y1, width: bbox.x2 - bbox.x1, height: bbox.y2 - bbox.y1 };
  } else {
    box = { x: 0, y: 0, width: 0, height: 0 };
  }
  // Clamp to image bounds (API can return slight negative offsets)
  return {
    x: Math.max(0, box.x),
    y: Math.max(0, box.y),
    width: Math.max(1, box.width),
    height: Math.max(1, box.height),
  };
};

/**
 * Converts a pixel bounding box into estimated real-world dimensions.
 * Ideally metersPerPixel comes from the sonar mission's range/swath metadata.
 */
const estimateDimensions = (bbox, missionMetadata = {}) => {
  const metersPerPixel = missionMetadata.metersPerPixel || 0.05; // TODO: source from real sonar calibration
  return {
    estimatedWidthMeters: Math.max(0.1, bbox.width * metersPerPixel),
    estimatedLengthMeters: Math.max(0.1, bbox.height * metersPerPixel),
  };
};

/**
 * TODO: Replace with real georeferencing once per-ping navigation data is
 * available. Until then this approximates a detection's position from the
 * mission's origin coords with a small offset per detection index.
 */
const estimateGeo = (baseLat, baseLng, index) => {
  const latNoise = randomFloat(-0.0015, 0.0015);
  const lngNoise = randomFloat(-0.0015, 0.0015);
  const spreadFactor = index * 0.0002;
  return {
    latitude: baseLat + latNoise + spreadFactor,
    longitude: baseLng + lngNoise + spreadFactor,
  };
};

/**
 * Downloads a file (image / video / sonar log) into a Buffer so it can be
 * re-posted to the SonarVision prediction service.
 */
const fetchFileBuffer = async (url) => {
  const resp = await axios.get(url, { responseType: 'arraybuffer', timeout: IMAGE_TIMEOUT });
  return resp.data;
};

/**
 * Posts a binary file to a SonarVision prediction endpoint as multipart/form-data.
 * @param {string} endpoint - e.g. /predict/image, /predict/video, /predict/realtime, /predict/log
 * @param {Buffer} buffer - raw file bytes
 * @param {string} filename - original file name (helps the service detect format)
 * @param {number} timeout
 * @returns {Object} parsed JSON body from the prediction service
 */
const postToSonarVision = async (endpoint, buffer, filename, timeout = IMAGE_TIMEOUT) => {
  if (!process.env.AI_SERVICE_URL) {
    throw new Error('AI_SERVICE_URL is not configured');
  }

  const form = new FormData();
  form.append('file', buffer, filename || 'sonar');

  try {
    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}${endpoint}?conf=${API_CONF_THRESHOLD}`,
      form,
      {
        headers: form.getHeaders(),
        timeout,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );
    return response.data;
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.response?.data?.detail || err.message;
    throw new Error(`AI detection service call failed${status ? ` (${status})` : ''}: ${message}`);
  }
};

/**
 * Model responses sometimes return detections as an array and sometimes as a
 * keyed object ({det_0: {...}, det_1: {...}}). Normalize both to an array.
 */
const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return Object.values(value);
  return [];
};

/**
 * Collects every image URL referenced by a frame/tile entry. The video API can
 * return multiple annotated images per frame (e.g. file1..file6, or an `images`
 * array), so we gather all of them instead of trusting a single url field.
 */
const collectImageUrls = (frame) => {
  const urls = [];
  const push = (u) => {
    if (typeof u === 'string' && u) urls.push(u);
  };

  if (Array.isArray(frame.images)) frame.images.forEach(push);
  else if (frame.images && typeof frame.images === 'object') Object.values(frame.images).forEach(push);
  else push(frame.images);

  ['file1', 'file2', 'file3', 'file4', 'file5', 'file6'].forEach((key) => push(frame[key]));
  push(frame.annotated_image_url ?? frame.annotated_url ?? frame.image_url ?? frame.imageUrl ?? frame.url);

  const unique = [...new Set(urls)];
  return { url: unique[0] ?? null, images: unique };
};

/**
 * Enriches a batch of raw model detections with hazard scoring, estimated
 * real-world dimensions, geo-position and human-readable interpretation.
 * Low-confidence and natural objects are filtered out.
 */
const enrichDetections = (rawDetections, missionMetadata = {}) => {
  const {
    latitude: baseLat = 12.9716,
    longitude: baseLng = 77.5946,
    locationName = 'Arabian Sea',
    depth: baseDepth = 45,
  } = missionMetadata;

  return toArray(rawDetections)
    .map((det, i) => {
      const objectType = mapYoloClassToObjectType(det.class ?? det.class_name);

      let confidence = det.confidence ?? det.conf ?? 0;
      confidence = Math.round(confidence * 1000) / 1000;
      if (confidence < CONFIDENCE_THRESHOLD) return null; // model-filtered low confidence

      const boundingBox = normalizeBoundingBox(det.bbox ?? det.box);
      const { estimatedWidthMeters, estimatedLengthMeters } = estimateDimensions(boundingBox, missionMetadata);
      const estimatedArea = estimatedWidthMeters * estimatedLengthMeters;

      const geo = estimateGeo(baseLat, baseLng, i);

      const hazardScore = calculateHazardScore({
        objectType,
        confidence,
        width: estimatedWidthMeters,
        length: estimatedLengthMeters,
        locationName,
        depth: baseDepth,
      });
      const hazardLevel = getHazardLevel(hazardScore);
      const confidenceLabel = getConfidenceLabel(confidence);
      const isNatural = NATURAL_TYPES.includes(objectType);

      return {
        objectType,
        confidence,
        confidenceLabel,
        boundingBox,
        estimatedWidthMeters: round1(estimatedWidthMeters),
        estimatedLengthMeters: round1(estimatedLengthMeters),
        estimatedArea: round1(estimatedArea),
        latitude: round5(geo.latitude),
        longitude: round5(geo.longitude),
        depth: round1(baseDepth + randomFloat(-5, 5)), // TODO: use real depth sensor reading if available
        hazardScore,
        hazardLevel,
        isAnomaly: !isNatural,
        isFiltered: isNatural,
        aiInterpretation: getAIInterpretation(objectType, confidence, hazardScore, estimatedWidthMeters, estimatedLengthMeters),
        recommendation: getRecommendation(objectType, hazardLevel, hazardScore),
        timestamp: new Date(),
      };
    })
    .filter(Boolean);
};

/**
 * Core image detection — sends the raw sonar image to /predict/image and
 * enriches the response. Returns detections + annotate image metadata.
 * @param {Object} image - SonarImage document ({ _id, originalName, imageUrl, ... })
 * @param {Object} missionMetadata - Mission location/calibration data
 */
export const analyzeSonarImage = async (image, missionMetadata = {}) => {
  const imageUrl = image.imageUrl || image.url || image.path;
  if (!imageUrl) {
    throw new Error(`No image URL found for image ${image._id || image.id || '(unknown)'}`);
  }

  const raw = await postToSonarVision(
    '/predict/image',
    await fetchFileBuffer(imageUrl),
    image.originalName || 'sonar.png',
    IMAGE_TIMEOUT
  );

  const rawDetections = toArray(raw.detections || []);
  const annotatedImageUrl = raw.annotated_image_url || imageUrl;
  const width = raw.width || image.width;
  const height = raw.height || image.height;
  const elapsedMs = raw.elapsed_ms;

  const detections = enrichDetections(rawDetections, missionMetadata).map((d, i) => ({
    ...d,
    imageId: image._id || image.id,
    imageName: image.originalName || image.imageUrl || `sonar_${i}.png`,
  }));

  return {
    imageId: image._id || image.id,
    imageName: image.originalName || image.imageUrl || `sonar_${Date.now()}.png`,
    annotatedImageUrl,
    width,
    height,
    elapsedMs,
    detections,
  };
};

/**
 * Batch image analysis for a mission.
 */
export const analyzeMission = async (images, mission) => {
  const allDetections = [];
  const annotatedImages = [];

  const missionMetadata = {
    latitude: mission.latitude,
    longitude: mission.longitude,
    locationName: mission.locationName,
    depth: mission.depth,
    metersPerPixel: mission.metersPerPixel,
  };

  for (const image of images) {
    try {
      const result = await analyzeSonarImage(image, missionMetadata);
      const enriched = result.detections.map((d) => ({
        ...d,
        mission: mission._id,
        sonarImage: image._id,
      }));
      allDetections.push(...enriched);
      annotatedImages.push({
        imageId: result.imageId,
        imageName: result.imageName,
        annotatedImageUrl: result.annotatedImageUrl,
        width: result.width,
        height: result.height,
        elapsedMs: result.elapsedMs,
      });
    } catch (err) {
      // Don't let one failed image kill the whole mission batch
      console.error(`Detection failed for image ${image._id || image.id}:`, err.message);
    }
  }

  // Filter natural objects (only store artificial anomalies)
  const anomalies = allDetections.filter((d) => d.isAnomaly && !d.isFiltered);

  return {
    totalImages: images.length,
    totalRawDetections: allDetections.length,
    totalAnomalies: anomalies.length,
    detections: anomalies, // Only anomalies stored as official detections
    rawDetections: allDetections, // For debugging/analytics
    annotatedImages, // Annotated/boxed image URLs to persist per sonar image
  };
};

/**
 * Video detection — sends a video to /predict/video and distills per-frame
 * detections + annotated frame URLs.
 * @param {{ videoUrl: string, filename: string }} video
 * @param {Object} missionMetadata
 */
export const analyzeVideo = async ({ videoUrl, filename }, missionMetadata = {}) => {
  if (!videoUrl) throw new Error('No video URL provided');
  const raw = await postToSonarVision(
    '/predict/video',
    await fetchFileBuffer(videoUrl),
    filename || 'sonar.mp4',
    BATCH_TIMEOUT
  );

  const list = raw.frames ?? raw.results ?? raw.annotations ?? [];
  const frames = toArray(list)
    .map((f, i) => {
      const detections = enrichDetections(toArray(f.detections ?? f.objects ?? f.bboxes), missionMetadata);
      const pics = collectImageUrls(f);
      return {
        index: i,
        timestamp: f.timestamp ?? f.frame_time ?? f.time ?? null,
        timeOffsetSec: f.sec ?? f.time_sec ?? f.timestamp_sec ?? (typeof f.timestamp === 'number' ? f.timestamp : null),
        url: pics.url,
        images: pics.images,
        detections,
      };
    })
    .filter((f) => f.url && f.detections.length > 0);

  return {
    frames,
    totalFrames: raw.total_frames ?? list.length,
    totalDetections: frames.reduce((sum, f) => sum + f.detections.length, 0),
    width: raw.width,
    height: raw.height,
    confThreshold: raw.conf_threshold ?? API_CONF_THRESHOLD,
    elapsedMs: raw.elapsed_ms,
  };
};

/**
 * Side-scan sonar log detection — sends a .xtf/.jsf file to /predict/log and
 * distills strip overviews, annotated tiles + detections.
 * @param {{ logUrl: string, filename: string }} log
 * @param {Object} missionMetadata
 */
export const analyzeLog = async ({ logUrl, filename }, missionMetadata = {}) => {
  if (!logUrl) throw new Error('No log URL provided');
  const raw = await postToSonarVision(
    '/predict/log',
    await fetchFileBuffer(logUrl),
    filename || 'sonar.xtf',
    BATCH_TIMEOUT
  );

  const toUrls = (arr) => (Array.isArray(arr)
    ? arr
        .map((x) => (typeof x === 'string' ? x : x.url ?? x.image_url ?? x.annotated_image_url ?? x.path))
        .filter(Boolean)
    : []);

  const strips = toUrls(raw.strips ?? raw.strip_overviews ?? raw.overviews ?? []);
  const tiles = toUrls(raw.tiles ?? raw.annotated_tiles ?? raw.tile_images ?? []);
  const detections = enrichDetections(toArray(raw.detections ?? raw.results ?? []), missionMetadata);

  return {
    strips,
    tiles,
    detections,
    totalDetections: detections.length,
    width: raw.width,
    height: raw.height,
    confThreshold: raw.conf_threshold ?? API_CONF_THRESHOLD,
    elapsedMs: raw.elapsed_ms,
  };
};

/**
 * Realtime frame prediction — a single webcam frame in, a prediction out.
 * Returns the raw rich payload (success, width, height, conf_threshold,
 * elapsed_ms, detections, annotated_image_url) with a mapped objectType added
 * to each detection for display.
 * @param {Buffer} buffer - raw image bytes
 * @param {string} filename
 */
export const analyzeRealtimeFrame = async (buffer, filename = 'frame.png') => {
  const raw = await postToSonarVision('/predict/realtime', buffer, filename, IMAGE_TIMEOUT);
  const detections = (raw.detections || []).map((d) => ({
    ...d,
    objectType: mapYoloClassToObjectType(d.class ?? d.class_name),
  }));
  return {
    success: raw.success,
    width: raw.width,
    height: raw.height,
    confThreshold: raw.conf_threshold ?? API_CONF_THRESHOLD,
    elapsedMs: raw.elapsed_ms,
    annotatedImageUrl: raw.annotated_image_url,
    detections,
  };
};

/**
 * Exported for backward compatibility with anywhere that called the
 * external service directly rather than through analyzeSonarImage.
 */
export const callExternalAIService = async (imageUrl) => {
  const raw = await postToSonarVision('/predict/image', await fetchFileBuffer(imageUrl), 'sonar.png', IMAGE_TIMEOUT);
  return (raw.detections || []).map((det) => ({
    objectType: mapYoloClassToObjectType(det.class ?? det.class_name),
    confidence: det.confidence ?? det.conf ?? 0,
    boundingBox: normalizeBoundingBox(det.bbox ?? det.box),
  }));
};
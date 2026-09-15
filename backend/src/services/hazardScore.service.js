/**
 * Hazard Scoring Engine
 * Calculates hazard score based on object type, confidence, size, environmental sensitivity
 */

const BASE_RISK = {
  'Ghost Net': 80,
  'Shipwreck': 70,
  'Cylinder': 60,
  'Pipe': 50,
  'Unknown Debris': 40,
  'Rock': 5,
  'Sand Ripple': 0,
  'Natural Ridge': 0,
  'Plane': 75,
  'Human': 85
};

const getConfidenceBonus = (confidence) => {
  if (confidence >= 0.95) return 10;
  if (confidence >= 0.85) return 5;
  if (confidence >= 0.70) return 2;
  return 0;
};

const getSizeBonus = (width, length) => {
  const area = width * length;
  if (area > 100) return 15; // Very large
  if (area > 50) return 10;  // Large
  if (area > 20) return 5;   // Medium
  return 0;
};

const getEnvironmentalBonus = (locationName = '', depth = 0) => {
  const sensitiveKeywords = ['coral', 'reef', 'marine protected', 'sanctuary', 'reserve', 'bengal', 'arabian'];
  const lowerLocation = locationName.toLowerCase();
  let bonus = 0;
  
  if (sensitiveKeywords.some(k => lowerLocation.includes(k))) {
    bonus += 10;
  }
  
  // Shallow water = more sensitive (coral zones, fishing areas)
  if (depth < 30) bonus += 5;
  if (depth < 10) bonus += 5;
  
  return Math.min(bonus, 15);
};

export const calculateHazardScore = ({ objectType, confidence, width, length, locationName, depth }) => {
  const base = BASE_RISK[objectType] || 30;
  const confBonus = getConfidenceBonus(confidence);
  const sizeBonus = getSizeBonus(width, length);
  const envBonus = getEnvironmentalBonus(locationName, depth);
  
  let score = base + confBonus + sizeBonus + envBonus;
  score = Math.min(100, Math.max(0, Math.round(score)));
  
  return score;
};

export const getHazardLevel = (score) => {
  if (score >= 81) return 'CRITICAL';
  if (score >= 61) return 'HIGH';
  if (score >= 31) return 'MEDIUM';
  return 'LOW';
};

export const getConfidenceLabel = (confidence) => {
  if (confidence >= 0.95) return 'Very High';
  if (confidence >= 0.85) return 'High';
  if (confidence >= 0.70) return 'Medium';
  return 'Low';
};

export const getAIInterpretation = (objectType, confidence, hazardScore, width, length) => {
  const interpretations = {
    'Ghost Net': `AI analysis indicates a high probability of abandoned fishing gear. The object's irregular structure, entangled appearance and acoustic signature are consistent with ghost net debris. Dimensions ${width.toFixed(1)}m x ${length.toFixed(1)}m suggest significant entanglement risk to marine megafauna. Confidence ${(confidence*100).toFixed(1)}%.`,
    'Pipe': `Detected linear acoustic anomaly consistent with submerged pipeline or pipe segment. Uniform cylindrical reflection and shadow pattern indicate man-made origin. Length ${length.toFixed(1)}m. May indicate illegal dumping or infrastructure debris. Confidence ${(confidence*100).toFixed(1)}%.`,
    'Cylinder': `Cylindrical object detected with strong acoustic return and distinct shadow. Geometry consistent with pressure vessel, drum, or industrial container. Potential chemical hazard if corroded. Dimensions ${width.toFixed(1)}m x ${length.toFixed(1)}m. Confidence ${(confidence*100).toFixed(1)}%.`,
    'Shipwreck': `Large structured acoustic target with complex geometry and extensive shadow. Consistent with shipwreck debris field. High sonar reflectivity suggests metallic structure. May pose navigation hazard and entanglement risk. Estimated extent ${width.toFixed(1)}m x ${length.toFixed(1)}m. Confidence ${(confidence*100).toFixed(1)}%.`,
    'Unknown Debris': `Unclassified artificial anomaly detected. Irregular but clearly non-natural acoustic signature with geometric edges not consistent with geological features. Requires ROV verification. Size ${width.toFixed(1)}m x ${length.toFixed(1)}m. Confidence ${(confidence*100).toFixed(1)}%.`,
    'Rock': `Natural geological feature identified. Irregular acoustic return consistent with rock formation or boulder. Low hazard, natural seabed feature.`,
    'Plane': `Confident detection of a submerged aircraft target. Complex metallic structure with strong acoustic shadow consistent with an airplane airframe. High-priority anomaly requiring identification of registry and incident context. Estimated extent ${width.toFixed(1)}m x ${length.toFixed(1)}m. Confidence ${(confidence*100).toFixed(1)}%.`,
    'Human': `Potential human-related target detected in sonar return. Suspected person in water or submerged human artifact. Requires immediate verification and search-and-rescue coordination. Confidence ${(confidence*100).toFixed(1)}%.`,
  };
  return interpretations[objectType] || interpretations['Unknown Debris'];
};

export const getRecommendation = (objectType, hazardLevel, hazardScore) => {
  if (hazardLevel === 'CRITICAL') {
    if (objectType === 'Ghost Net') return 'Immediate Investigation: Deploy ROV/AUV for visual confirmation and coordinate removal operation. Notify marine conservation authority. High entanglement risk.';
    if (objectType === 'Shipwreck') return 'Immediate Investigation: Mark as navigation hazard, notify hydrographic office. Deploy inspection vehicle for structural assessment.';
    if (objectType === 'Human') return 'Immediate Investigation: Possible person in water. Alert search-and-rescue and verify with ROV/diver deployment without delay.';
    if (objectType === 'Plane') return 'Immediate Investigation: Submerged aircraft target. Notify maritime authority and aviation incident response teams for confirmation.';
    return 'Immediate Investigation: Deploy underwater inspection vehicle for confirmation and removal assessment. Priority 1.';
  }
  if (hazardLevel === 'HIGH') {
    return 'Priority Investigation: Schedule ROV inspection within 72 hours. Document for removal planning. Notify monitoring team.';
  }
  if (hazardLevel === 'MEDIUM') {
    return 'Routine Monitoring: Include in next scheduled survey. Monitor for movement or degradation. Low immediate risk.';
  }
  return 'Log and Monitor: Record location for baseline mapping. No immediate action required. Re-evaluate on next survey.';
};

export const OBJECT_TYPES = ['Ghost Net', 'Pipe', 'Cylinder', 'Shipwreck', 'Unknown Debris', 'Plane', 'Human'];
export const HAZARD_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const VEHICLE_TYPES = ['Ship', 'AUV', 'ROV'];

export const HAZARD_COLORS = {
  LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30'
};

export const HAZARD_DOT = {
  LOW: 'bg-emerald-400',
  MEDIUM: 'bg-yellow-400',
  HIGH: 'bg-orange-400',
  CRITICAL: 'bg-red-500'
};

export const OBJECT_ICONS = {
  'Ghost Net': '🕸️',
  'Pipe': '🛢️',
  'Cylinder': '🧴',
  'Shipwreck': '🚢',
  'Unknown Debris': '❓',
  'Plane': '✈️',
  'Human': '🧍'
};

export const CONFIDENCE_COLORS = {
  'Very High': 'text-cyan-400',
  'High': 'text-blue-400',
  'Medium': 'text-yellow-400',
  'Low': 'text-orange-400'
};

export const MOCK_STATS = {
  totalImages: 50000,
  totalHazards: 1200,
  avgConfidence: 94,
  totalMissions: 18
};

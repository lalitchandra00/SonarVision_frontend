import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import missionRoutes from './routes/mission.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import videoRoutes from './routes/video.routes.js';
import logRoutes from './routes/log.routes.js';
import realtimeRoutes from './routes/realtime.routes.js';
import detectionRoutes from './routes/detection.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import reportRoutes from './routes/report.routes.js';
import errorMiddleware from './middlewares/error.middleware.js';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://sonarvisionfrontend.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'OceanSentinel AI API - Marine Debris Detection Platform',
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/missions',
      '/api/upload',
      '/api/analysis',
      '/api/video',
      '/api/logs',
      '/api/realtime',
      '/api/detections',
      '/api/analytics',
      '/api/reports'
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/realtime', realtimeRoutes);
app.use('/api/detections', detectionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler (must be last)
app.use(errorMiddleware);

export default app;

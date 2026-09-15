import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🌊 OceanSentinel AI Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(process.env.AI_SERVICE_URL
        ? `🌐 SonarVision AI Engine: ${process.env.AI_SERVICE_URL}`
        : '🤖 Mock AI Detection Engine: ACTIVE');
      console.log(`🗺️  Hazard Scoring Engine: ACTIVE`);

      if (process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_API_SECRET === process.env.CLOUDINARY_API_KEY) {
        console.warn('⚠️  CLOUDINARY_API_SECRET looks wrong: it equals CLOUDINARY_API_KEY. Uploads to Cloudinary will fail with "Invalid Signature". Update backend/.env with the real API Secret from the Cloudinary dashboard.');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Never let a transient failure (bad cloud upload, external API hiccup) kill
// the server. Log it and keep serving; endpoints return clean 500s instead.
process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err?.message || err);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

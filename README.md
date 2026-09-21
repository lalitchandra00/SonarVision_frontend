# OceanSentinel AI — Marine Debris Detection Platform
# OceanSentinel AI — Marine Debris & Sonar Intelligence Platform

**AI-Powered Side-Scan Sonar Analysis for Marine Debris Detection**
<div align="center">

Professional MERN-stack application for government/marine research agencies to automatically analyze Side-Scan Sonar (SSS) imagery, detect ghost nets, pipes, cylinders, shipwrecks, and unknown artificial anomalies.
![OceanSentinel AI Banner](https://img.shields.io/badge/OceanSentinel-AI%20Sonar%20Vision-06b6d4?style=for-the-badge&logo=target&logoColor=white)
![Stack](https://img.shields.io/badge/Stack-MERN%20+%20FastAPI%20YOLO-0ea5e9?style=for-the-badge&logo=react&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Side--Scan%20Sonar%20(SSS)-0284c7?style=for-the-badge&logo=safari&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-38bdf8?style=for-the-badge)

![OceanSentinel](https://img.shields.io/badge/Stack-MERN-22d3ee?style=for-the-badge)
![AI](https://img.shields.io/badge/AI-Mock%20YOLO%20Engine-06b6d4?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
<br />

## 🌊 Problem Solved
**Advanced AI-Powered Acoustic Vision for Autonomous Marine Debris Detection, Sonar Video Streams, Bathymetric Sonar Logs (.XTF/.JSF), and Live Drone/Webcam Feeds.**

- Ghost nets threaten marine ecosystems
- Manual sonar inspection is slow (8+ hrs per survey)
- Thousands of sonar images create backlogs
- Natural features mimic debris acoustically
[Key Features](#-key-features) • [System Architecture](#-system-architecture) • [Multi-Modal Ingestion](#-multi-modal-ingestion-pipeline) • [AI & Hazard Scoring](#-ai-detection--hazard-scoring-engine) • [API Reference](#-api-endpoints-reference) • [Quick Start](#-quick-start--installation) • [Deployment](#-environment-variables--deployment)

## 🔄 Workflow
</div>

```
Side-Scan Sonar Image
↓ Upload (JPG/PNG/TIFF/ZIP)
↓ Preprocessing (Speckle reduction, Contrast)
↓ AI Object Detection (Mock YOLO)
↓ Confidence Filtering (<50% ignored)
↓ Hazard Scoring (0-100)
↓ Metadata Parsing + Geotagging
↓ Interactive Map Visualization
↓ JSON/CSV Report Generation
```
---

## 🧱 Tech Stack
## 🌊 Overview & Problem Statement

**Frontend**
- React 18 + Vite
- Tailwind CSS (dark ocean theme, glassmorphism)
- React Router DOM, Axios
- Framer Motion, React Icons
- Recharts (analytics), React Leaflet (maps)
- React Dropzone, Toastify
Ghost fishing gear, discarded industrial pipelines, chemical cylinders, and artificial maritime wreckage represent a severe and escalating ecological threat to oceanic biodiversity, navigation channels, and coral reef ecosystems. 

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT + HTTP-only cookies + bcryptjs
- Multer + Cloudinary
- Helmet, CORS, Morgan, Cookie Parser
### Critical Challenges in Conventional Marine Monitoring:
- **Exhaustive Manual Inspection:** Hydrographic surveyors spend **8+ hours per survey mission** reviewing thousands of megabytes of acoustic waterfall imagery.
- **Acoustic Mimicry & Speckle Noise:** Natural seabed structures (such as geological ridges, sandwaves, and boulders) acoustic echo profiles mimic man-made debris, leading to human fatigue and high error rates.
- **Format Heterogeneity:** Side-scan sonar data arrives across raw digital logs (`.xtf`, `.jsf`), video waterfalls, or hydrographic mosaic stills with fragmented geolocation metadata.
- **Latency in Response:** Without real-time edge processing or immediate hazard indexing, critical navigational hazards and coral-entangling ghost nets go unaddressed for weeks.

**AI Architecture (Mock for prototype)**
```
Frontend → Express API → Mock AI Detection Engine → Results
Future:  → Python FastAPI YOLO Service → Real Model
```
**OceanSentinel AI** resolves this bottleneck by integrating state-of-the-art computer vision (YOLO-based acoustic detection) with full-lifecycle mission governance, geospatial mapping, automated hazard scoring, and multi-modal file ingestion.

Isolated in `services/aiDetection.service.js` for easy replacement.
---

## 📁 Project Structure
## ⚡ Key Features

```
ocean-sentinel-ai/
├── backend/
│   ├── src/
│   │   ├── config/ (db, cloudinary, seed)
│   │   ├── controllers/
│   │   ├── models/ (User, Mission, SonarImage, Detection)
│   │   ├── routes/
│   │   ├── middlewares/ (auth, role, upload, error)
│   │   ├── services/ (aiDetection, hazardScore, metadataParser, reportGenerator)
│   │   ├── utils/ (ApiError, ApiResponse, asyncHandler)
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/ (Navbar, Sidebar, StatCard, DetectionCard, SonarUploader, DetectionOverlay, HazardBadge, MapComponent, LoadingPipeline)
    │   ├── pages/ (Home, Login, Register, Dashboard, UploadMission, AnalysisResults, MissionHistory, MapView, AnomalyDetails, AdminDashboard)
    │   ├── layouts/
    │   ├── services/ (api)
    │   ├── context/ (AuthContext)
    │   ├── hooks/ (useAuth)
    │   ├── utils/ (constants, formatters)
    │   ├── App.jsx
    │   └── main.jsx
    ├── vite.config.js
    ├── tailwind.config.js
    └── .env.example
```
### 🎯 Multi-Modal Sonar Ingestion
- **Side-Scan Sonar Imagery:** High-resolution batch upload (`.jpg`, `.png`, `.tiff`, `.zip`) with automated speckle filtering and contrast enhancement.
- **Continuous Sonar Video Streams:** Direct upload of ROV/AUV video feeds (`.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`) sampled at dynamic frame intervals.
- **Hydrographic Sonar Logs:** Native acoustic log processing supporting eXtended Triton Format (`.xtf`) and Edgetech (`.jsf`).
- **Real-Time Drone / Webcam Ingestion:** Live browser-based optical/sonar stream prediction with adjustable drone-proxy capture cadences (1–10s) and dynamic detection overlays.

## 🚀 Quick Start
### 🧠 Intelligent Acoustic Object Detection & Filtering
- **Trained Marine Object Classes:** Ghost Nets, Underwater Pipes, Metallic Cylinders, Shipwrecks, Aircraft Debris, and Unknown Anthropogenic Debris.
- **Natural Feature Discrimination:** Automated acoustic filtering of benign seabed morphology (e.g., natural ridges, sand ripples, rocks) ensuring minimal false alarms.
- **Dual Engine Architecture:** Production integration with dedicated Python FastAPI YOLO service (`https://sonarvision.onrender.com`) with automated fallback handling.

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account (optional, mock fallback exists)
### ⚠️ Dynamic Hazard & Risk Assessment
- **Multi-Factor Scoring Matrix (0–100):** Real-time hazard indexing taking into account object classification, detection confidence, geometric scale (bounding box area), depth tier, and proximity to marine reserves/coral biomes.
- **Hazard Classification Tiers:**
  - `CRITICAL` (81–100) — Immediate environmental/navigational intervention required.
  - `HIGH` (61–80) — Substantial debris hazard requiring prompt recovery.
  - `MEDIUM` (31–60) — Monitored secondary anomaly.
  - `LOW` (0–30) — Negligible artificial imprint.

### Backend Setup
### 🗺️ Interactive Geospatial Mapping & Telemetry
- **Leaflet & OpenStreetMap Integration:** Live GPS positioning of all detected anomalies with interactive risk-graded radar pin markers.
- **Interactive Sonar Inspection Overlays:** Visual canvas highlighting bounding boxes, confidence tags, dimensions, AI interpretation summaries, and recommended field countermeasures.

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values:
# MONGO_URI=mongodb://localhost:27017/oceansentinel
# JWT_SECRET=your_secret
# CLOUDINARY_CLOUD_NAME=...
# CLOUDINARY_API_KEY=...
# CLOUDINARY_API_SECRET=...
# FRONTEND_URL=http://localhost:5173
### 📊 Mission Governance & Enterprise Reporting
- **Multi-Role Access Control (RBAC):** Distinct workflows for Field Researchers (mission authoring, uploads, inspection) and Administrators (fleet-wide analytics, user management, system diagnostics).
- **Export Formats:** Single-click generation of audit-ready JSON and CSV survey reports including timestamped coordinates, hazard classifications, and AI recommendations.

npm run dev    # http://localhost:5000
npm run seed   # optional: create demo users & missions
```
---

**Demo accounts created by seed:**
- Admin: `admin@oceansentinel.ai / admin123`
- Researcher: `researcher@oceansentinel.ai / researcher123`
## 🏗️ System Architecture

### Frontend Setup
```mermaid
flowchart TD
    subgraph Client ["Frontend (React 18 + Vite + Tailwind CSS)"]
        UI["Mission Control UI / Dashboard"]
        RealtimeUI["Real-time Drone Stream (:missionId)"]
        Map["Leaflet GIS Map & Overlays"]
        AuthContext["Auth Context & Protected Routes"]
    end

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
    subgraph Gateway ["Backend (Node.js + Express 4)"]
        API["Express API Server"]
        AuthMid["JWT & HTTP-Only Cookie Security"]
        UploadMid["Multer (Memory/Disk) + Cloudinary"]
        HazardEng["Hazard Scoring & Geo Engine"]
    end

npm run dev    # http://localhost:5173
    subgraph AI_Cluster ["Acoustic AI Service (Python FastAPI)"]
        YOLO["YOLOv8 Acoustic Sonar Model"]
        ImgProc["Pre-processing & CLAHE Speckle Reduction"]
        VideoSampler["Video Frame Extraction Engine"]
        LogParser["XTF/JSF Stream Interpreter"]
    end

    subgraph Storage ["Persistent Storage"]
        Mongo[("MongoDB Atlas (Missions, Detections, Logs)")]
        Cloudinary[("Cloudinary Asset CDN")]
    end

    UI -->|REST API + Bearer/Cookie| API
    RealtimeUI -->|Snapshot Frame Posts| API
    API --> AuthMid
    API --> UploadMid
    UploadMid --> Cloudinary
    API -->|Multipart Form-Data| YOLO
    YOLO --> ImgProc
    YOLO --> VideoSampler
    YOLO --> LogParser
    YOLO -->|BBoxes + Classes + Confidences| API
    API --> HazardEng
    HazardEng --> Mongo
    Mongo --> API
    API --> Map
```

## 🔐 Auth & Roles
---

- **Researcher**: Upload, analyze, view maps, download reports, history
- **Admin**: Global analytics, all missions, users, high-risk anomalies
## 🚀 Multi-Modal Ingestion Pipeline

JWT in HTTP-only cookies + Bearer fallback, protected routes, role middleware.
| Ingestion Mode | Input Supported | Target Page | Processing Pipeline | Output Artifact |
| :--- | :--- | :--- | :--- | :--- |
| **Still Sonar Images** | `.jpg`, `.png`, `.tiff`, `.zip` | `/upload` | Bounded batching, Cloudinary upload, `/predict/image` | Geo-referenced detections, overlay visualizations |
| **Sonar Video Waterfall** | `.mp4`, `.mov`, `.avi`, `.mkv`, `.webm` | `/upload/video` | Temporal frame sampling (1 frame / 3s), frame batch inference | Sequential frame detections & anomalies timeline |
| **Digital Sonar Logs** | `.xtf`, `.jsf`, `.sdf` | `/upload/log` | Raw sonar ping & channel parsing, acoustic mosaic inference | Ping metadata, acoustic waterfall coordinate maps |
| **Real-Time Stream** | Video stream / Webcam / Drone Feed | `/realtime/:missionId` | Dynamic cadence polling (1–10s loop), in-flight gate | Realtime frame record, instant hazard alert overlay |

## 🧠 Mock AI Engine
---

File: `backend/src/services/aiDetection.service.js`
## 🧠 AI Detection & Hazard Scoring Engine

- Simulates YOLO detection
- Random 0-3 detections per image
- Weighted types: Ghost Net (25%), Pipe (20%), Cylinder (15%), Shipwreck (10%), Unknown (20%), Rock (10% filtered)
- Confidence filtering: <0.50 ignored, 0.50-0.69 Low, 0.70-0.84 Medium, 0.85-0.94 High, 0.95-1.0 Very High
- Natural objects (Rock, Sand Ripple) filtered
- Future: Replace `analyzeSonarImage()` with `axios.post(AI_SERVICE_URL)`
### 1. Acoustic Target Classes & Weights

## ⚠️ Hazard Scoring
```
  [Ghost Net]       ==> Base Risk: 80 | Critical entangler for marine fauna
  [Shipwreck]       ==> Base Risk: 70 | Navigational hazard & fuel/chemical risk
  [Cylinder]        ==> Base Risk: 60 | Pressurized or hazardous cargo threat
  [Pipe]            ==> Base Risk: 50 | Discarded industrial conduit
  [Unknown Debris]  ==> Base Risk: 40 | Unclassified artificial signature
  [Rock / Ripple]   ==> Ignored       | Filtered as benign seabed morphology
```

File: `backend/src/services/hazardScore.service.js`
### 2. Multi-Parameter Hazard Formula
The platform computes a unified **Hazard Score (0–100)** evaluating:
$$\text{Hazard Score} = \text{Base Risk} + \Delta_{\text{size}} + \Delta_{\text{confidence}} + \Delta_{\text{location}} + \Delta_{\text{depth}}$$

Base risk: Ghost Net 80, Shipwreck 70, Cylinder 60, Pipe 50, Unknown 40
- **Scale Bonus ($\Delta_{\text{size}}$):** $+10$ to $+15$ points for anomalies spanning significant seabed area.
- **Confidence Bonus ($\Delta_{\text{confidence}}$):** $+5$ to $+10$ points for detections with confidence $\ge 85\%$.
- **Eco-Zone Sensitivity ($\Delta_{\text{location}}$):** $+10$ points if coordinates fall within designated marine protected areas, sanctuaries, or coral reefs.
- **Shallow Water Navigation Hazard ($\Delta_{\text{depth}}$):** $+5$ points for depths $< 30\,\text{m}$ posing surface vessel collision risk.

Bonuses:
- Large size (+10-15)
- High confidence (+5-10)
- Sensitive zone (coral, reserve) (+10)
- Shallow depth (<30m +5)
---

Levels: 0-30 LOW (green), 31-60 MEDIUM (yellow), 61-80 HIGH (orange), 81-100 CRITICAL (red)
## 📁 Repository Structure

## 🗺️ API Endpoints

```
Auth:
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
GET  /api/auth/users (admin)
SonarVision_frontend/
├── backend/
│   ├── src/
│   │   ├── config/             # MongoDB Atlas connection & database seeders
│   │   ├── controllers/        # Controllers (auth, mission, upload, video, log, realtime, analysis, etc.)
│   │   ├── middlewares/        # JWT auth, role validation, Multer uploads, error handler
│   │   ├── models/             # Mongoose schemas: User, Mission, SonarImage, Video, SonarLog, RealtimeFrame, Detection
│   │   ├── routes/             # Express API routing definitions
│   │   ├── services/           # AI detection proxy, hazard scoring, metadata parser, reporting
│   │   ├── utils/              # ApiError, ApiResponse, asyncHandler helpers
│   │   ├── app.js              # Express app configuration, CORS, middleware assembly
│   │   └── server.js           # Server bootstrap & process lifecycle
│   ├── package.json
│   └── .env                    # Backend environment config
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, Sidebar, HazardBadge, DetectionOverlay, MapComponent, etc.)
│   │   ├── context/            # AuthContext (state, tokens, session management)
│   │   ├── hooks/              # Custom React hooks (useAuth, etc.)
│   │   ├── layouts/            # DashboardLayout, AdminLayout
│   │   ├── pages/              # Application views:
│   │   │   ├── Home.jsx             # Hero landing page with animated sonar radar
│   │   │   ├── Login.jsx & Register # Authentication & role onboarding
│   │   │   ├── Dashboard.jsx        # Researcher overview & telemetry metrics
│   │   │   ├── UploadMission.jsx    # Still sonar image ingestion pipeline
│   │   │   ├── VideoUpload.jsx      # ROV / Sonar video feed analysis
│   │   │   ├── LogUpload.jsx        # .XTF / .JSF bathymetric log upload
│   │   │   ├── RealtimeSetup.jsx    # Drone & webcam stream configuration
│   │   │   ├── RealtimePredict.jsx  # Live stream inference with interactive HUD
│   │   │   ├── AnalysisResults.jsx  # Sonar waterfall overlay & detection explorer
│   │   │   ├── MissionHistory.jsx   # Tabular mission ledger with search/filters
│   │   │   ├── MapView.jsx          # Interactive Leaflet GIS hazard map
│   │   │   ├── AnomaliesList.jsx    # Ranked high-risk anomaly registry
│   │   │   ├── AnomalyDetails.jsx   # Deep-dive inspection & field recommendations
│   │   │   ├── AdminDashboard.jsx   # Platform-wide governance & user administration
│   │   │   └── NotFound.jsx         # 404 error handler view
│   │   ├── services/           # Axios client with interceptors
│   │   ├── utils/              # Constants, risk color helpers, formatters
│   │   ├── App.jsx             # React Router routing topology
│   │   ├── main.jsx            # Application mount point
│   │   └── index.css           # Tailwind CSS directives & custom neon-ocean styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── requirements.txt            # Unified project dependency manifesto
└── README.md                   # System documentation
```

Missions:
POST /api/missions
GET  /api/missions?search=&status=&page=&limit=
GET  /api/missions/:id
DELETE /api/missions/:id
GET  /api/missions/stats/overview
---

Upload:
POST /api/upload/sonar (multipart, field: sonarImages, body: missionId)
POST /api/upload/metadata (CSV)
## 🗺️ API Endpoints Reference

Analysis:
POST /api/analysis/:missionId/start
GET  /api/analysis/:missionId
GET  /api/analysis/:missionId/status
### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` — Register new researcher or operator account.
- `POST /api/auth/login` — Authenticate and receive JWT cookie + payload.
- `POST /api/auth/logout` — Invalidate session and clear authorization cookies.
- `GET  /api/auth/me` — Retrieve active profile & permission metadata.
- `GET  /api/auth/users` — *(Admin only)* List all registered platform users.

Detections:
GET  /api/detections?missionId=&objectType=&hazardLevel=&minConfidence=&search=&page=&limit=
GET  /api/detections/high-risk
GET  /api/detections/mission/:missionId
GET  /api/detections/:id
DELETE /api/detections/:id
### 🚢 Missions & Telemetry (`/api/missions`)
- `POST /api/missions` — Initialize new mission profile (coordinates, vessel, depth, metadata).
- `GET  /api/missions` — Query paginated missions with search, status, and date filters.
- `GET  /api/missions/:id` — Fetch complete mission profile and telemetry.
- `DELETE /api/missions/:id` — Delete mission and cascade associated detections.
- `GET  /api/missions/stats/overview` — High-level KPI aggregations for active researcher.

Reports:
GET /api/reports/:missionId/json
GET /api/reports/:missionId/csv
GET /api/reports/:missionId/preview
### 📤 Multi-Modal Ingestion (`/api/upload`, `/api/video`, `/api/logs`, `/api/realtime`)
- `POST /api/upload/sonar` — Upload sonar images (multipart, field: `sonarImages`).
- `POST /api/upload/metadata` — Import mission metadata CSV.
- `POST /api/video/upload` — Upload sonar video recordings (`.mp4`, `.mov`, `.avi`, `.mkv`).
- `POST /api/video/:missionId/start` — Trigger temporal frame extraction & inference.
- `GET  /api/video/:missionId` — Fetch video analysis outcomes and sampled frames.
- `POST /api/logs/upload` — Upload raw digital sonar logs (`.xtf`, `.jsf`, `.sdf`).
- `POST /api/logs/:missionId/start` — Initiate sonar log parsing and ping detection.
- `GET  /api/logs/:missionId` — Retrieve processed log detections and acoustic sweeps.
- `POST /api/realtime/predict` — Send single live frame for immediate YOLO inference.
- `POST /api/realtime/:missionId/record` — Commit detected frame to mission history.
- `POST /api/realtime/:missionId/end` — Conclude live session and compile mission report.

Analytics:
GET /api/analytics/dashboard
GET /api/analytics/trends
GET /api/analytics/system (admin)
```
### 🔍 Detections & Hazard Analysis (`/api/detections`, `/api/analysis`)
- `POST /api/analysis/:missionId/start` — Dispatch AI inference pipeline for mission images.
- `GET  /api/analysis/:missionId` — Retrieve classified bounding boxes and images.
- `GET  /api/detections` — Search and filter detections by class, hazard level, and confidence.
- `GET  /api/detections/high-risk` — Fetch prioritized anomalies requiring intervention.
- `GET  /api/detections/:id` — Inspect individual detection metadata and spatial metrics.

## 📊 Frontend Pages
### 📑 Reports & System Analytics (`/api/reports`, `/api/analytics`)
- `GET  /api/reports/:missionId/json` — Export complete mission audit packet as JSON.
- `GET  /api/reports/:missionId/csv` — Generate geospatial survey spreadsheet (CSV).
- `GET  /api/reports/:missionId/preview` — In-browser preview of compiled findings.
- `GET  /api/analytics/dashboard` — Platform detection distribution, hazard charts, and trends.
- `GET  /api/analytics/system` — *(Admin only)* Server health, storage footprint, and throughput.

- `/` Landing with sonar animation, problem/solution, features, stats
- `/login`, `/register`
- `/dashboard` Researcher analytics (missions, images, hazards, critical, charts)
- `/upload` 3-step: Mission metadata → Upload (dropzone) → AI analysis (pipeline animation)
- `/analysis/:missionId` Sonar overlay with bounding boxes, toggles, detection cards, download
- `/missions` History table with search/filter
- `/map` Leaflet map with risk-colored markers, popups
- `/anomalies/:id` Full detail, location, dimensions, AI interpretation, recommendation
- `/anomalies` High-risk list
- `/admin` Global analytics, top critical, system stats
---

## 🎨 UI/UX
## 🚀 Quick Start & Installation

- Dark ocean theme: #020617 background, #0f172a cards, cyan #22d3ee accents
- Glassmorphism, Framer Motion, sonar radar animation, custom scrollbars
- Responsive, desktop-first dashboard, professional government/research feel
### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local instance (v6.0+) or MongoDB Atlas cluster URI
- **Cloudinary Account**: Cloud name, API Key, and API Secret for image CDN storage

## 📄 Reports

JSON:
```json
{
  "mission": "Mission Alpha",
  "analysisDate": "2026-08-29",
  "totalImages": 250,
  "totalDetections": 12,
  "criticalHazards": 3,
  "detections": [...]
}
### 1. Clone & Setup Workspace
```bash
git clone https://github.com/lalitchandra00/SonarVision_frontend.git
cd SonarVision_frontend
```

CSV columns: Mission, Object Type, Confidence, Hazard Score, Hazard Level, Latitude, Longitude, Width, Length, Timestamp, AI Interpretation, Recommendation
### 2. Backend Installation & Execution
```bash
cd backend
npm install

## 🔮 Future YOLO Integration
# Create local environment configuration
cp .env.example .env   # Or create .env based on the configuration guide below

Keep logic isolated in `aiDetection.service.js`. Replace mock with:
# Seed demo users & sample missions (Optional)
npm run seed

```js
const res = await axios.post(process.env.AI_SERVICE_URL, { image_url: imageUrl })
return transformYOLOResponse(res.data)
# Launch backend in development mode
npm run dev
# Server running at: http://localhost:5000
```

Expected YOLO response:
```json
{ "detections": [{ "class": "ghost_net", "confidence": 0.94, "bbox": [120,80,350,230] }] }
> **Default Seed Accounts:**
> - **Administrator:** `admin@oceansentinel.ai` / `admin123`
> - **Lead Researcher:** `researcher@oceansentinel.ai` / `researcher123`

### 3. Frontend Installation & Execution
```bash
cd ../frontend
npm install

# Launch frontend development server
npm run dev
# Vite client running at: http://localhost:5173
```

## 🛠️ .env Examples
---

**Backend `.env.example`** already provided. Required:
```
## ⚙️ Environment Variables & Deployment

### Backend Configuration (`backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb://...
JWT_SECRET=...
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/oceansentinel?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# AI Detection Microservice (FastAPI YOLO)
AI_SERVICE_URL=https://sonarvision.onrender.com
```

**Frontend `.env.example`**
```
### Frontend Configuration (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

## 📦 Deliverable
---

Complete project ready for `npm install` and `npm run dev` in both folders. Zip file includes frontend + backend + README + .env.example.
## 🛠️ Technology Stack Detail

Workflow verified:
Login → Create Mission → Upload Sonar → Start AI Analysis (animated pipeline) → Mock Detection → Filtering → Hazard Scoring → Geotagging → Visualization → Map → Download JSON/CSV
```
Frontend:
  ├── Core Framework: React 18.3.1 (Vite 5.3.3)
  ├── Styling & Animations: Tailwind CSS 3.4, Framer Motion 11.3
  ├── GIS & Mapping: Leaflet 1.9.4, React Leaflet 4.2.1
  ├── Data Visualization: Recharts 2.12.7
  ├── Drag-and-Drop: React Dropzone 14.2
  └── Routing & Feedback: React Router DOM 6.23, React Toastify 10.0

Backend:
  ├── Runtime: Node.js (ES Modules)
  ├── Web Framework: Express.js 4.19
  ├── Database: MongoDB Atlas via Mongoose 8.5
  ├── Authentication: JSON Web Tokens (jsonwebtoken 9.0) + bcryptjs
  ├── Asset Processing: Multer + Cloudinary SDK 1.41
  └── Security: Helmet, CORS, Cookie-Parser, Morgan Logging

AI Microservice:
  ├── Framework: Python FastAPI
  ├── Model: Ultralytics YOLOv8 Sonar-Tuned Checkpoints
  └── Pre-processing: OpenCV (CLAHE contrast normalization, despeckling)
```

---

Built for marine conservation teams and underwater monitoring agencies. Professional, production-style, reusable components, MVC backend, centralized error handling, loading/empty states, toast notifications, form validation.
## 🛡️ Security & Compliance

**OceanSentinel AI** — Cleaner oceans through intelligent sonar analysis.
- **Sanitized Upload Pipelines:** Dual-stage file validation strictly whitelisting verified MIME types for sonar imagery, hydrographic logs, and video formats with strict byte-size ceilings.
- **Secure Token Delivery:** Bearer JWT tokens delivered with configurable HTTP-only cookies preventing cross-site scripting (XSS) compromise.
- **CORS Hardening:** Rigorous origin whitelisting protecting endpoints against cross-origin forgery.
- **Graceful Fault Tolerance:** Unreachable remote AI service triggers internal model fallback heuristics ensuring zero data loss during mission uploads.

---

## 🤝 Contributing & License

Contributions are welcome! For major feature additions or acoustic dataset integrations, please open an issue first to discuss what you would like to change.

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <sub>Developed for Autonomous Marine Debris Remediation & Oceanic Conservation.</sub>
</div>

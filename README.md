# GPS-Based Restricted Area Warning & Violation Detection System for Vehicles

**SDM College of Engineering & Technology, Dhavalagiri, Dharwad – 580002**  
*Department of Computer Science & Engineering — VII Semester Major Project - I*

- **Project Guide:** Dr. S. B. Kulkarni (Associate Professor, Dept. of CSE & Dean IPD, SDMCET)
- **Team Members:**
  1. Amogh S Patil (`2SD23CS011`)
  2. Aryan Shetty (`2SD23CS019`)
  3. Dharesh Dodmani (`2SD23CS030`)
  4. Neha B Hunshikatti (`2SD23CS062`)

---

## 1. System Overview

A pure-software, road-aware geofencing system that eliminates the need for expensive physical infrastructure (boom barriers, dedicated RFID tags, surveillance cameras) for restricting vehicle entry into sensitive zones. 

The system leverages existing smartphone GPS or vehicle telematics to:
1. Continuously track vehicle coordinates and heading.
2. Compute **road-network proximity and ETA** to the nearest restricted zone boundary using the **OSRM (Open Source Routing Machine)** engine (not straight-line Euclidean distance).
3. Push advance **in-cabin heads-up warnings** to the driver app when within a configurable threshold (e.g. 500 meters along the road network).
4. Perform real-time **point-in-polygon geofence checks**; if the vehicle crosses the perimeter, an instant **violation alert** is broadcast over WebSockets to the Security Command Center and permanently recorded in an immutable audit log.

---

## 2. Architecture & Component Stack

```
   ┌─────────────────────────────────────────────────────────────┐
   │        Vehicle Client App / Driver HUD Simulator            │
   │      (Reports GPS ping lat/lon, speed, heading)             │
   └───────────────┬─────────────────────────────▲───────────────┘
                   │ GPS ping                     │ HUD Warning
                   ▼                             │ WebSocket
   ┌─────────────────────────────────────────────────────────────┐
   │                       Django Backend                        │
   │       • Point-in-polygon geofence check (Shapely)           │
   │       • Threshold evaluation (<500m road distance)          │
   │       • WebSocket service (Django Channels + Daphne)        │
   └───┬───────────────────────────┬─────────────────────────┬───┘
       │ Boundary Query            │ Query/Write             │ Alert Broadcast
       ▼                           ▼                         ▼
┌──────────────┐          ┌───────────────────┐    ┌────────────────────┐
│ OSRM Routing │          │    SQLite / DB    │    │ Security Dashboard │
│ Engine (Road │          │ Restricted zones, │    │ Live tactical map, │
│ network dist │          │ vehicles, audit   │    │ incident logs, CSV │
│ & ETA)       │          │ violation logs    │    │ audit export       │
└──────────────┘          └───────────────────┘    └────────────────────┘
```

- **Backend:** Python 3, Django, Django REST Framework, Django Channels, Daphne (ASGI), Shapely.
- **Routing Engine:** OSRM (Open Source Routing Machine) integration with graceful fallback.
- **Frontend & Visualizations:** React.js, Vite, Tailwind CSS, Leaflet & React-Leaflet, Lucide Icons, Web Audio API chime.
- **Base Map:** OpenStreetMap vector tiles.

---

## 3. Key Modules & Functional Views

### 🛡️ Security Command Center (`/`)
- Tactical dark-mode Leaflet map showing active restricted zones (Cantonment, Campus High Security, VIP Corridors, Disaster Relief zones).
- Real-time vehicle positions with dynamic heading indicators and status badges:
  - 🔵 **Normal** (Permitted transit)
  - 🟡 **Approaching Warning** (Within < 500m road-network proximity)
  - 🔴 **Perimeter Breach** (Active violation inside restricted polygon)
- Live incident queue with one-click **Acknowledge** and **Resolve** workflows.
- Audio-visual alert banner with synthesis tone.

### 🚗 Driver Cockpit & Route Simulator
- Driver companion HUD reflecting in-cabin smartphone/telematics behavior.
- Real-time digital Speedometer, Heading Compass, and Road Distance/ETA Countdown to nearest zone boundary.
- Dynamic warning banners:
  - *Normal:* "Permitted Transit • All Clear"
  - *Warning:* "⚠️ Approaching Restricted Zone! Distance: 449m by road. ETA: 69s."
  - *Violation:* "🚨 Critical Restricted Area Violation! Incident logged & security alerted."
- Demonstration route simulator with pre-mapped Dharwad / SDMCET routes:
  1. *Route 1:* Dhavalagiri Road Approach to Cantonment (Breach & Violation Test)
  2. *Route 2:* SDMCET Main Gate to Campus Examination & Research Cordon
  3. *Route 3:* Dharwad Safe Outer Bypass (Proves zero false positives)

### 📐 Restricted Zone Studio (Admin)
- Interactive polygon drawing tool on OpenStreetMap base tiles.
- Set Zone Name, Category (`CANTONMENT`, `DISASTER_AREA`, `VIP_CORRIDOR`, `CAMPUS_RESTRICTED`, `GENERAL`), Severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), Road Warning Threshold (meters), and Custom Color.
- Zone activation toggle and delete capability.
- One-click button to reseed default SDMCET / Dharwad demo zones.

### 📋 Security Audit Trail
- Full searchable, filterable log of all boundary breaches and vehicle entries.
- Filter by vehicle number, driver, restricted zone, and status (`ACTIVE`, `ACKNOWLEDGED`, `RESOLVED`).
- One-click **Export CSV Audit Report** for project reviews and reports.

---

## 4. How to Run the Project

### Option A: One-Click Launch (Recommended on Windows)
Simply double-click:
```bat
start_system.bat
```
*(Or in PowerShell: `./start_system.ps1`)*

This launches both the Daphne ASGI backend server (Port 8000) and the React Vite frontend (Port 5173).

---

### Option B: Manual Execution

#### Terminal 1 — Backend:
```powershell
cd "c:\Users\amogh\Downloads\major project"
.\venv\Scripts\Activate.ps1
cd backend
python -m daphne -b 127.0.0.1 -p 8000 core_backend.asgi:application
```

#### Terminal 2 — Frontend:
```powershell
cd "c:\Users\amogh\Downloads\major project\frontend"
npm run dev
```

Then open your browser at:
- **Application Dashboard:** `http://localhost:5173/`
- **Backend REST API:** `http://localhost:8000/api/`
- **Django Admin Console:** `http://localhost:8000/admin/`

---

## 5. API Reference Summary

| Endpoint | Method | Description |
|---|---|---|
| `/api/zones/` | `GET`, `POST` | List and create restricted geofence polygons |
| `/api/vehicles/` | `GET`, `POST` | List registered vehicles and real-time statuses |
| `/api/vehicles/location/` | `POST` | Ingest vehicle GPS ping (`lat, lng, speed, heading`) & trigger logic |
| `/api/violations/` | `GET`, `PATCH` | Audit log of violations and security acknowledgment |
| `/api/dashboard/stats/` | `GET` | Overview metrics for Security Command Center |
| `/api/simulation/routes/` | `GET` | Retrieve pre-mapped Dharwad demonstration trajectories |
| `/api/seed-demo-data/` | `POST` | Initialize sample zones and vehicles in Dharwad |
| `ws://localhost:8000/ws/security/` | `WebSocket` | Real-time broadcast stream for security dashboard |
| `ws://localhost:8000/ws/driver/<vehicle>/` | `WebSocket` | Real-time heads-up warning stream for driver |

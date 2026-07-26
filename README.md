# RouteWise - Commercial Route Planner & HOS Compliance System

A production-ready commercial truck route planning, OpenRouteService mapping, and FMCSA Hours of Service (HOS) compliance platform built with **React 18 (Vite)**, **Tailwind CSS**, **React Leaflet**, **Django 5**, **Django REST Framework (DRF)**, and **PostgreSQL**.

---

## 🌟 Features Overview

- **OpenRouteService Integration**: Calculates real-world route geometry, total driving distance (miles), and driving duration (hours).
- **Interactive Leaflet Mapping**: Renders interactive maps with polyline route geometry and color-coded markers (`Current`, `Pickup`, `Dropoff`, `Fuel Stop`, `Rest Break`).
- **Stop Planner**: Automatically inserts mandatory 30-minute **Fuel Stops every 1000 miles**, 1-hour **Pickup loading**, and 1-hour **Dropoff unloading**.
- **Modular HOS Engine**: Enforces interstate FMCSA rules:
  - 11-Hour Driving Limit per shift
  - 14-Hour Duty Window Limit per shift
  - 30-Minute Rest Break after 8 cumulative driving hours
  - 10-Hour Consecutive Rest Break to reset shift timers
  - 70-Hour / 8-Day Cycle Limit (triggers 34-hour cycle restart if cycle is exhausted)
- **FMCSA Driver Daily Logs**: Automatically generates multi-day daily log sheets categorizing hours into 4 duty statuses (`Off Duty`, `Sleeper Berth`, `Driving`, `On Duty`), verifying exact 24.0-hour daily totals and remarks.
- **Modern Responsive UI**: Dark-themed Tailwind CSS design optimized for desktop, tablet, and mobile viewports.
- **Robust Error & Form Validation**: Instant client-side input validation and graceful backend API error banner handling with retry capabilities.

---

## 🏗️ Architecture & Tech Stack

```text
RouteWise/
├── backend/
│   ├── config/             # Django settings, WSGI, URLs
│   ├── planner/            # Models (Trip, Stop, DailyLog), Serializers, Views
│   ├── services/           # Clean Architecture Services:
│   │   ├── ors_service.py         # OpenRouteService Geocoding & GeoJSON Directions
│   │   ├── hos_engine.py          # FMCSA 11h/14h/8h/10h/70h Rules Engine
│   │   ├── stop_planner.py        # 1000m Fuel Stop & Operational Stop Planner
│   │   └── daily_log_generator.py # 24.0h Multi-day FMCSA Daily Log Generator
│   ├── utils/              # Helper functions & response formatters
│   ├── tests/              # Django test suites (17 tests)
│   ├── build.sh            # Render deployment build script
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── assets/         # Static images & icons
│   │   ├── components/     # Atomic UI components (Navbar, TripForm, MapPlaceholder, etc.)
│   │   ├── hooks/          # Custom React hooks (useMap)
│   │   ├── pages/          # Home & TripPlanner page containers
│   │   ├── services/       # Axios API integration (tripService.js)
│   │   ├── tests/          # Vitest + React Testing Library suites (8 tests)
│   │   └── utils/          # UI badge helpers (uiHelpers.js)
│   ├── package.json
│   ├── vercel.json         # Vercel SPA deployment config
│   └── vite.config.js
├── render.yaml             # Render Blueprint configuration
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Python**: 3.10+
- **Node.js**: 18+ / npm 9+
- **PostgreSQL**: 14+ (or SQLite fallback)

### 1. Backend Setup

```bash
cd backend
python -m venv venv

# Windows PowerShell
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt
python manage.py migrate
python manage.py test
python manage.py runserver 8000
```
Backend will run at `http://localhost:8000/`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm test
npm run dev
```
Frontend will run at `http://localhost:5173/`

---

## 🌐 Production Deployment Guide

### Frontend Deployment (Vercel)

1. Push your repository to **GitHub**.
2. Log into [Vercel Dashboard](https://vercel.com/) and click **Add New Project**.
3. Import your `RouteWise` GitHub repository.
4. Set **Root Directory** to `frontend`.
5. Set Environment Variable:
   - `VITE_API_BASE_URL`: `https://routewise-backend.onrender.com/api`
6. Click **Deploy**. Vercel will build the bundle using `frontend/vercel.json` SPA routing rules.

---

### Backend & Database Deployment (Render)

1. Log into [Render Dashboard](https://render.com/).
2. Create a **New PostgreSQL Database**:
   - Name: `routewise-db`
   - Database: `routewise_db`
   - Copy the internal/external `Connection String`.
3. Create a **New Web Service**:
   - Connect your GitHub repository.
   - Environment: `Python`
   - Root Directory: `backend`
   - Build Command: `./build.sh`
   - Start Command: `gunicorn config.wsgi:application`
4. Set Environment Variables on Render:
   - `SECRET_KEY`: `<your-random-django-secret-key>`
   - `DEBUG`: `False`
   - `ALLOWED_HOSTS`: `.onrender.com,localhost,127.0.0.1`
   - `DATABASE_URL`: `<your-render-postgresql-connection-string>`
   - `ORS_API_KEY`: `<your-openrouteservice-api-key>`
   - `CSRF_TRUSTED_ORIGINS`: `https://routewise-frontend.vercel.app`

---

## 🔑 Production Environment Variables Reference

| Variable Name | Description | Example / Recommended Value |
|---|---|---|
| `SECRET_KEY` | Django Cryptographic Secret Key | `django-insecure-routewise-production-key` |
| `DEBUG` | Django Debug Mode | `False` |
| `ALLOWED_HOSTS` | Allowed HTTP Host headers | `.onrender.com,localhost` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/routewise_db` |
| `ORS_API_KEY` | OpenRouteService API Key | `5b3ce3597851110001cf6248...` |
| `VITE_API_BASE_URL` | Backend REST API Base URL (Frontend) | `https://routewise-backend.onrender.com/api` |

---

## 📑 API Endpoints Documentation

### 1. Health Check
- **Endpoint**: `GET /api/health/`
- **Response**: `200 OK`
```json
{
  "status": 200,
  "message": "Service is healthy",
  "data": { "service": "RouteWise Planner Service" }
}
```

### 2. Plan Trip
- **Endpoint**: `POST /api/trip/plan`
- **Request Body**:
```json
{
  "current_location": "New York, NY",
  "pickup_location": "Philadelphia, PA",
  "dropoff_location": "Chicago, IL",
  "current_cycle_used": 34.0
}
```
- **Response**: `201 Created`
```json
{
  "status": 201,
  "message": "Trip plan generated successfully",
  "data": {
    "id": 1,
    "current_location": "New York, NY",
    "pickup_location": "Philadelphia, PA",
    "dropoff_location": "Chicago, IL",
    "current_cycle_used": 34.0,
    "total_distance": 792.0,
    "total_duration": 12.75,
    "geometry": [[40.7128, -74.006], [39.9526, -75.1652], [41.8781, -87.6298]],
    "stops": [
      { "sequence_order": 1, "location_name": "New York, NY", "stop_type": "CURRENT", "latitude": 40.7128, "longitude": -74.006, "duration_minutes": 0 },
      { "sequence_order": 2, "location_name": "Philadelphia, PA", "stop_type": "PICKUP", "latitude": 39.9526, "longitude": -75.1652, "duration_minutes": 60 },
      { "sequence_order": 3, "location_name": "Chicago, IL", "stop_type": "DROPOFF", "latitude": 41.8781, "longitude": -87.6298, "duration_minutes": 60 }
    ],
    "timeline": [
      { "start_time": "2026-07-25T08:00:00Z", "end_time": "2026-07-25T11:00:00Z", "duration_hours": 3.0, "status": "Driving", "location_name": "En route to Philadelphia, PA", "remarks": "Driving segment (Pickup Leg)" }
    ],
    "daily_logs": [
      { "day_number": 1, "date": "2026-07-25", "driving_hours": 8.5, "on_duty_hours": 1.5, "off_duty_hours": 4.0, "sleeper_hours": 10.0, "total_hours": 24.0, "remaining_cycle_hours": 26.0 }
    ]
  }
}
```

---

## 📹 Loom Video Demo Recording Checklist

Use this checklist during your video demo walkthrough:

- [x] **1. Introduction**: Briefly present RouteWise tech stack (React + Django REST Framework + PostgreSQL + React Leaflet + OpenRouteService).
- [x] **2. Navigation & Layout**: Highlight dark-mode responsive design, sticky Navbar, and Footer.
- [x] **3. Client-Side Form Validation**: Clear a required field or enter cycle hours >70 to demonstrate instant inline red error validation text preventing submission.
- [x] **4. Route Planning Execution**: Enter `Current Location`, `Pickup Location`, `Dropoff Location`, and `Current Cycle Used`. Click **Calculate Route** to show the animated loading spinner.
- [x] **5. OpenRouteService & Leaflet Map**: Show calculated polyline route geometry and interactive Leaflet map markers for Current, Pickup, Dropoff, and Fuel stops.
- [x] **6. Trip Summary Metrics**: Point out calculated total driving distance (miles) and duration (hours).
- [x] **7. Stop Planner & Ordered Schedule**: Scroll to the **Ordered Trip Schedule** table below the map demonstrating 1000-mile Fuel stops, 1h Pickup, and 1h Dropoff stops.
- [x] **8. Merged HOS Operational Timeline**: Show chronological timeline entries enforcing 11h driving, 14h window, 30m break after 8h, and 10h rest breaks.
- [x] **9. FMCSA Driver Daily Logs**: Point out the multi-day Daily Log sheets verifying exact **24.0-hour total per day** and cycle hours remaining.
- [x] **10. Mobile Responsiveness**: Toggle mobile viewport to showcase fluid grid stacking.

---

## 🧪 Testing Summary

```bash
# Run Backend Tests (Django)
cd backend
python manage.py test
# Result: 17 tests passed in 2.238s

# Run Frontend Tests (Vitest)
cd frontend
npm test
# Result: 4 test files passed, 8 tests passed
```

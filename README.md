# BUILDVANTAGE — Enterprise Labour Supply & Workforce Registry

A modern, high-performance web platform built for contractors, labor aggregators, site foremen, and enterprise construction managers to register, verify, allocate, dispatch, and track skilled and general workforce across multiple project sites.

![BuildVantage Preview](https://img.shields.io/badge/Status-Operational-10b981?style=for-the-badge)
![Compliance](https://img.shields.io/badge/Compliance-OSHA%20%7C%20Govt%20KYC-f59e0b?style=for-the-badge)
![Tech](https://img.shields.io/badge/Stack-HTML5%20%7C%20Vanilla%20CSS%20%7C%20ES6+-06b6d4?style=for-the-badge)

---

## 🌟 Key Capabilities & Features

### 1. 📊 Executive Operations & Live KPI Analytics
- **Total Registered Workforce**: Live counter of all laborers cataloged across trades.
- **Available Reserve Pool**: Real-time count & percentage of workers ready for immediate dispatch.
- **Active Deployments**: Direct monitoring of deployed crew across active construction sites.
- **Compliance & Safety Index**: Percentage tracking of statutory KYC biometric verification, OSHA-30 safety cards, and medical fitness clearances.
- **Daily Wage Outflow**: Real-time calculation of estimated daily payroll for deployed crews.

### 2. 👷 Centralized Workforce Directory
- **Trade & Skill Classification**: Masonry, Carpentry, Electrical, Plumbing, Welding, Heavy Equipment, Scaffolding, Steel Fixing, Helper, and Painting.
- **Granular Search & Filtering**: Instant search across worker names, badge IDs (`#LAB-80X`), trades, phone numbers, or skill keywords.
- **Rank & Experience Tiers**: Apprentice, Journeyman, Master Craftsman, and Site Supervisor.
- **Dual Display Modes**: Seamless toggle between responsive **Grid Cards View** and high-density **Data Table View**.
- **Worker Dossier**: Full modal profile displaying past project history, specialized tools, blood group, emergency contacts, and performance ratings.

### 3. 🏗️ Construction Sites & Requisitions Manager
- Track work orders, contractor clients, site supervisors, and shift schedules.
- Visual quota fulfillment progress bars (e.g. 12/15 crew filled).
- **1-Click Dispatch Engine**: Allocate available laborers to specific project sites with custom shift timings and supervisor safety notes.
- **Instant Recall**: Return workers to the reserve pool when tasks complete.

### 4. 📋 Daily Shift Attendance & Wage Ledger
- Daily shift punch sheet supporting **Full Day (8h)**, **Overtime (+2h / +4h with 1.5x multiplier)**, **Half Day (0.5x)**, and **Absent**.
- Live net wage calculation per worker and shift total summary.
- **Batch Punch**: Single click "Mark All Deployed Present".
- **CSV Export**: Download timestamped daily wage reports directly into Excel / CSV.

### 5. 🪪 Digital Field ID Pass & Compliance Center
- Generates official laminated-style safety ID passes complete with:
  - Worker photo & trade badge
  - Unique ID code & Blood group
  - Anti-tamper hologram insignia & OSHA-30 certification stamp
  - Scannable QR code
- **Direct Badge Printing**: Styled with `@media print` stylesheets for instant badge generation.

### 6. 🎨 Dual Themes & Accessibility
- **Night Operations (Dark Mode)**: Sleek, high-contrast palette with glassmorphism and industrial amber/cyan/emerald accents.
- **Field High-Vis (Light Mode)**: Tailored for harsh sunlight readability on outdoor tablets and mobile screens on active job sites.

---

## 🚀 How to Run Locally

You can serve this project with any local HTTP server:

### Option A: Using Python (Recommended)
```bash
python -m http.server 3000
```
Then visit `http://localhost:3000` in your browser.

### Option B: Using Node / npx
```bash
npx serve .
```

### Option C: Direct Browser
Open `index.html` directly in any modern web browser.

---

## 💾 Data Storage
The application utilizes browser `localStorage` for complete client-side data persistence. Newly registered workers, status changes, attendance punches, and site requisitions persist between reloads. You can reset to the original sample dataset at any time via the **"Reset Demo"** button in the header.

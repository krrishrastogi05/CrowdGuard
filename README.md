
# 👁️ CrowdGuard

### Panoptic Surveillance & Intelligent Crisis Response System

> **"Turning Chaos into Order."**
> An AI-powered command center that synthesizes unstructured real-time data into actionable intelligence for emergency response.

## 🚀 Overview

**CrowdGuard** is a sophisticated crowd management and situational awareness platform designed for large venues. It utilizes the internal **Aegis AI Engine** (powered by Google Gemini) to analyze real-time surveillance feeds, detect anomalies, and coordinate emergency response units via a live, interactive dashboard.

### 💡 The Problem

In critical moments following a disaster, control rooms face:

* **Information Overload:** Thousands of panic calls and social posts.
* **Unstructured Data:** Hard-to-map images, voice recordings, and text.
* **Slow Response:** Manual verification delays critical dispatch decisions.

### ⚡ The Solution

CrowdGuard acts as a "Central Nervous System," instantly analyzing incoming media to extract geolocation and severity, visualizing threats on a heatmap, and automating unit dispatch.

---

## ✨ Key Features

### 1. 🗺️ Live Command Dashboard

* **Real-time Map:** Interactive SVG-based stadium map utilizing **Leaflet** and **WebSockets** for sub-second updates.
* **Unit Tracking:** Live GPS-style tracking of stewards, medics, drones, and police units.
* **Heatmap Overlay:** Thermography mode to visualize crowd density and risk levels dynamically.

### 2. 🤖 Aegis AI Analysis (Powered by Gemini)

* **Forensic Breakdown:** Analyzes CCTV images to identify specific threats (e.g., "Smoke plume," "Crushing").
* **Risk Scoring:** Automatically rates incidents (Safe, Moderate, Critical) and calculates density scores (1-10).
* **Strategic Recommendations:** AI generates actionable containment strategies (e.g., "Close Gate NE," "Deploy Medic to Section B").

### 3. 📢 Incident Management & Dispatch

* **One-Click Deploy:** Assign the nearest available unit to an incident directly from the map.
* **Automated Reporting:** Generate comprehensive executive situation reports summarizing all active zones.
* **Public Advisory:** AI drafts context-aware emergency alerts for public broadcast.

### 4. 🧪 Simulation Tools

* **Feed Injector:** A dedicated interface to simulate crowd reports, inject mock CCTV imagery, and test system responsiveness without real-world chaos.

---

## 🛠️ Tech Stack

### Frontend (Client)

* **Framework:** React 18 + Vite
* **Styling:** Tailwind CSS + Framer Motion (Animations)
* **Mapping:** Leaflet Maps (React-Leaflet) + Custom SVG Overlays
* **Icons:** Lucide React

### Backend (Server)

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (Atlas) via Mongoose
* **Real-Time:** Socket.io (Bi-directional communication)

### Artificial Intelligence

* **Model:** Google Gemini 2.0 Flash (via `@google/genai` SDK)
* **Engine:** Aegis Crowd Analysis AI

---

## ⚙️ Installation & Setup

### Prerequisites

* **Node.js** (v18 or higher)
* **MongoDB Atlas** Account (Connection String)
* **Google Gemini API Key** (Get one at [Google AI Studio](https://aistudio.google.com/))

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/crowdguard.git
cd crowdguard

```

### 2. Backend Setup

Navigate to the server directory and install dependencies:

```bash
cd server
npm install

```

Create a `.env` file in the `server` folder with the following variables:

```env
PORT=3001
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/aegis_db
GEMINI_API_KEY=your_google_gemini_api_key

```

Start the backend server:

```bash
npm run dev
# Server will run on http://localhost:3001

```

### 3. Frontend Setup

Open a new terminal, navigate to the client directory, and install dependencies:

```bash
cd client
npm install

```

Create a `.env` file in the `client` folder (optional if running locally on default ports):

```env
VITE_API_URL=http://localhost:3001

```

Start the frontend development server:

```bash
npm run dev
# Client will run on http://localhost:5173

```

---

## 📖 Usage Guide

1. **Launch the Dashboard:** Open `http://localhost:5173/dashboard`.
2. **Launch the Simulator:** Open `http://localhost:5173/inject` in a separate tab.
3. **Simulate an Incident:**
* Use the **Feed Injector** to upload an image of a crowd.
* Add a text description (e.g., "People pushing near North Gate").
* Click "Analyze & Inject".


4. **Monitor & Respond:**
* Watch the **Dashboard** as the AI processes the data.
* A red alert marker will appear on the map.
* Click the marker to view AI analysis.
* Click a nearby "Idle" unit to **Deploy** them to the scene.



---

## 📡 API Endpoints

The backend exposes the following RESTful endpoints:

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/analyze` | Process image/text context via Gemini AI |
| `POST` | `/api/generate-report` | Generate a venue-wide situation report |
| `GET` | `/api/incidents` | Fetch all active incidents |
| `POST` | `/api/incidents` | Manually create an incident |
| `GET` | `/api/units` | Fetch all response units |
| `POST` | `/api/units/deploy` | Update unit status and location |
| `POST` | `/api/reset` | Clear all incidents and reset units |

---

## 🤝 Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

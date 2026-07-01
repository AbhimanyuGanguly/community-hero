# 🦸 Community Hero

> **A Hyperlocal AI-Powered Problem Solver Platform**

Community Hero is a full-stack web application designed to empower citizens to report, track, and resolve local civic issues (such as potholes, waterlogging, or broken streetlights). It leverages **Google's Gemini AI** to automatically categorize, verify, and prioritize incoming reports, streamlining the workflow for local municipalities and accelerating community resolutions.

---

## ✨ Features

- **📍 Geolocated Issue Reporting**: Users can drop a pin on an interactive map and upload images of civic problems.
- **🤖 AI-Powered Triage**: Integrates with Google Gemini AI to automatically assess issue severity, categorize the problem, and detect potential duplicate reports.
- **👥 Community Verification**: A crowdsourced upvoting and verification system to prevent spam and prioritize critical infrastructure failures.
- **🏛️ Mock Government Portal**: A simulated dashboard where local authorities can track metrics, view AI predictions, and update issue statuses.
- **🛡️ Secure Authentication**: JWT-based user authentication and bcrypt password hashing.

---

## 🏗️ Architecture & Tech Stack

Community Hero is built as a **clean, unified monolith** to prioritize speed, simplicity, and ease of deployment.

- **Frontend**: Vanilla HTML/CSS/JS (Lightweight, zero-build-step, fast time-to-interactive)
- **Backend**: Node.js & Express.js
- **Database**: SQLite (via `better-sqlite3`)
- **AI Integration**: `@google/generative-ai` (Gemini Pro)
- **Deployment**: Dockerized for seamless deployment to **Fly.io** or any standard VPS with persistent volume mounts.

### Why SQLite?
For this application, **SQLite** was intentionally chosen over heavier relational databases like PostgreSQL. Running the database in-process alongside the Node.js server eliminates network latency, requires zero external database hosting costs, and drastically simplifies the deployment pipeline, all while maintaining robust ACID compliance through Write-Ahead Logging (WAL).

---

## 🚀 Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AbhimanyuGanguly/community-hero.git
   cd community-hero
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and add your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to include your actual `GEMINI_API_KEY` and `JWT_SECRET`.*

4. **Run the Application:**
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:3000` and automatically seed the SQLite database with realistic demo data.*

---

## 🐳 Deployment (Docker & Fly.io)

This project includes a production-ready `Dockerfile` and `fly.toml` configuration for instant deployment to [Fly.io](https://fly.io), ensuring the SQLite database persists across container restarts.

1. **Install Fly CLI** and authenticate: `fly auth login`
2. **Create a persistent volume** for the database:
   ```bash
   fly volumes create community_hero_data --size 1 --region otp
   ```
3. **Deploy**:
   ```bash
   fly deploy
   ```

Alternatively, you can run the application on any standard VPS using the included `docker-compose.yml`:
```bash
docker compose up -d --build
```

---

## 📄 License
MIT License - feel free to use and modify for your own community projects!

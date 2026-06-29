# 🏨 HMS — Hostel Management System

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_15-black?style=for-the-badge&logo=next.js&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![AWS RDS](https://img.shields.io/badge/AWS_RDS-FF9900?style=for-the-badge&logo=amazon-rds&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=google-gemini&logoColor=white)

**A high-fidelity, production-grade enterprise hostel management system featuring AI-powered predictive analysis, automated visitor management, and real-time Socket.IO notifications.**

[Live Demo Credentials](#-demo-credentials) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [Environment Variables](#-environment-variables)

</div>

---

## ✨ Features & Portals

The application implements a strict Role-Based Access Control (RBAC) workflow partition across four user tiers:

### 🎓 Student Portal
* **Dashboard:** Personal metrics overview showing recent leave requests, notice board cards, outstanding fee invoice counts, and active complaint logs.
* **Room details:** View current room allocations (Room ID, Bed Number, Room Type, Floor, and Roommate directory listings).
* **Leave Requests:** Apply for hostel leaves. Automatically runs an AI risk model assessing risk flags based on duration and history.
* **Complaints:** File maintenance/hostel complaints (automatically classified by Gemini into categories like *Electrical*, *Plumbing*, etc.).
* **Payments:** Online fee portal supporting mockup Razorpay/Stripe integration, monthly invoice status tracking, and receipt uploads.
* **AI Assistant:** An embedded chatbot powered by Google Gemini to answer questions regarding hostel rules, timings, and custom queries.

### 🛡️ Warden Portal
* **Dashboard:** Warden-specific summaries listing pending leave counts, open maintenance issues, active visitor counters, and current building occupancy bars.
* **Student Directory:** View registered students, filter by floor/building, and view details.
* **Room Allocation:** Interactive grid showing all rooms and beds. Allows assigning vacant beds to students with a visual floor-by-floor allocation UI.
* **Visitor Tracking:** Register new visitors directly, verify entry status, and checkout active visitors to historical log records.
* **Leave & Complaint Management:** Review leave requests with approval comments and track/update complaint states (*Open* ➔ *In Progress* ➔ *Resolved*).
* **Attendance:** Mark present/absent logs daily with a calendar view.
* **Fee Auditing:** Monitor and verify all transactions and billing reports.

### 👑 Admin Portal
* **Analytics Board:** Real-time revenue charts (AreaChart), bed availability ratios (PieChart), total user counts, and system-wide statistics.
* **Warden Management:** Add and register new wardens, link them to specific hostels/buildings, and list active management profiles.
* **AI Risk Report:** A centralized dashboard listing students flagged with higher leave frequencies or pending warnings, complete with AI recommendation summaries.
* **Audit Trails:** Centralized logs detailing user logins, profile registrations, allocations, and database queries.

### 🔑 Super Admin Portal
* **System Monitors:** Track uptime status for core servers, database connections (AWS RDS), Redis cache latency, and AI gateway availability.
* **Management Controls:** Create new administrator profiles, flush cache memories, and trigger database backup sequences.

---

## 🏗️ Architecture

```
┌──────────────────┐     ┌──────────────────────────┐
│   Next.js 15     │     │  Express 5 + TypeScript   │
│   (Frontend)     │────▶│  (REST API + Socket.IO)   │
│   Port 3000      │     │  Port 5000                │
└──────────────────┘     └──────┬──────────┬─────────┘
                                │          │
                         ┌──────▼───┐ ┌────▼─────┐
                         │ AWS RDS  │ │  Redis   │
                         │(Postgres)│ │(Mock/Mem)│
                         └──────────┘ └──────────┘
```

### Technology Stack
* **Frontend:** Next.js 15 (App Router), React 19, TailwindCSS, Zustand State Management, TanStack React Query.
* **Backend:** Express 5, Node.js, TypeScript, Zod request payload schema validation.
* **Database & ORM:** AWS RDS PostgreSQL, Prisma 6 ORM Client.
* **Cache System:** Redis 7 (includes an automated in-memory mock fallback class for offline development if Redis services are unavailable).
* **Real-time Gateway:** Socket.IO for pushing instant notifications and visitor updates.
* **AI Services:** Google Gemini API Integration (`@google/generative-ai`).

---

## 🚀 Quick Start

### Prerequisites
* **Node.js 20+**
* **Git**
* (Optional) **Docker Desktop** (if you want to run Redis/Postgres services locally rather than on the cloud)

### Setup & Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/UnknownHawkins/HOSTEL-MANAGEMENT-SYSTEM.git
   cd HOSTEL-MANAGEMENT-SYSTEM
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the `backend/` directory (see [.env Configurations](#-environment-variables)).

3. **Initialize Database and Schema:**
   Install dependencies, push the Prisma schema, and seed the default accounts:
   ```bash
   cd backend
   npm install
   
   # Push Prisma schema to your target PostgreSQL database
   npx prisma db push
   
   # Seed default users and sample hostel structures
   npx prisma db seed
   ```

4. **Launch Backend Server:**
   ```bash
   npm run dev
   ```

5. **Launch Frontend Client:**
   Open a new terminal window:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The client will boot on [http://localhost:3000](http://localhost:3000).

---

## 🔐 Demo Credentials

Use these seeded credentials to test the various dashboards:

| Role | Username | Password | Notes |
|---|---|---|---|
| **Super Admin** | `UnknownHawkins7217` | `Stuxnet2007@` | Full system monitor and admin creation |
| **Admin** | `admin` | `Stuxnet2007@` | Revenue graphs, AI risk board, audit logs |
| **Warden** | `Warden` | `12345678901234` | Room allocation, visitor check-in, attendance |
| **Student 1** | `student1` | `1111` | View allocated room, request leave, chatbot |
| **Student 2** | `student2` | `2222` | Request leave, view payments, chatbot |
| **Student 3** | `student3` | `3333` | View payments, file complaints, chatbot |

---

## 📁 Project Structure

```
HOSTEL-MANAGEMENT-SYSTEM/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (22+ relational tables)
│   │   └── seed.ts                # Repeatable cleaning & database seeding logic
│   ├── src/
│   │   ├── controllers/           # REST endpoint handlers (Auth, Visitor, Rooms, AI)
│   │   ├── routes/                # Endpoint routing definitions
│   │   ├── middlewares/           # RBAC checks, rate limiters, error catchers
│   │   ├── utils/                 # Redis connectors, Prisma clients, logger instances
│   │   ├── app.ts                 # Express initialization
│   │   └── index.ts               # HTTP & Socket.IO server startup
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js 15 pages (student, warden, admin panels)
│   │   ├── components/            # UI components and layout blocks (sidebar, sidebar links)
│   │   ├── store/                 # Zustand globally shared states
│   │   └── lib/                   # Fetch API hooks and socket connections
│   └── package.json
└── README.md
```

---

## 🔧 Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | ❌ | `5000` | Port for the Express server to listen on. |
| `DATABASE_URL` | ✅ | - | PostgreSQL connection URL (e.g. AWS RDS or local). |
| `JWT_SECRET` | ✅ | - | JWT signature key for authentication tokens. |
| `JWT_REFRESH_SECRET` | ✅ | - | JWT signature key for refresh tokens. |
| `REDIS_URL` | ❌ | - | Local Redis connection URL. Leave blank or delete this line to auto-enable the built-in Mock Redis cache client. |
| `GEMINI_API_KEY` | ❌ | - | Google Gemini API Key. Leave blank to run AI features in Mock/fallback mode. |
| `SMTP_HOST` | ❌ | `smtp.mailtrap.io` | SMTP service host for email notifications. |
| `SMTP_PORT` | ❌ | `2525` | SMTP port. |
| `SMTP_USER` | ❌ | - | SMTP authentication username. |
| `SMTP_PASS` | ❌ | - | SMTP authentication password. |
| `CLOUDINARY_URL` | ❌ | - | Cloudinary URL for hosting profile pictures and document uploads. |
| `NODE_ENV` | ❌ | `development` | Set to `production` when deploying live to secure errors and optimize logging. |

### Frontend Configuration (`frontend/.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | `http://localhost:5000/api/v1` | URL of the running backend Express API. |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ | `http://localhost:5000` | URL of the backend Socket.IO socket server. |

---

## 🔌 Resilient Offline Architecture & Fallbacks

To ensure high developer onboarding speed and offline capability, the platform integrates robust local fallbacks:
* **In-Memory Cache (Redis Fallback):** If `REDIS_URL` is omitted or empty, the application automatically falls back to an internal high-fidelity mock implementation. This mock replicates key caching operations using a local JavaScript Map structure.
* **Mock Gemini AI Gateway:** If `GEMINI_API_KEY` is not provided or fails initialization, the AI Assistant and Leave Risk Analyzer automatically utilize a contextual mock model generator, providing mock replies.

---

## 📄 License

GNU General Public License v3.0 (GPL-3.0) — Anyone can use, modify, and distribute this software, but all derivative works must remain open-source under the same GPL-3.0 license. Proprietary or closed-source usage is not permitted without explicit paperwork or written permission.

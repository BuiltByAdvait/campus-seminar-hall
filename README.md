# Campus Seminar Hall Booking & Management System

A production-quality full-stack system for centralized seminar hall booking, scheduling,
cancellation, check-in/check-out, feedback, and reporting across multiple institutes.

![Project Banner](banner.png)

## Overview

**Problem**: Campus institutes share limited seminar halls, but currently must manually
check availability with each department — time-consuming and error-prone.

**Solution**: A centralized web application that manages hall availability, bookings,
scheduling, cancellations, usage tracking, feedback, and reporting in one place.

## Features

### Student / Faculty Features
- User authentication (JWT-based login/registration)
- Profile management with institute/department info
- Browse available seminar halls
- Check real-time hall availability by date/time
- Book seminar halls for events (seminar, workshop, assembly, etc.)
- Cancel eligible future bookings
- Check-in and check-out at event time
- Provide post-event feedback and ratings
- View personal booking history

### Admin Features
- View all bookings and schedules
- Manage seminar halls (create, update, status)
- Manage institutes and departments
- View user profiles and roles
- View check-in/check-out data
- View feedback and administrative evaluations
- Generate reports and analytics
- Manage booking statuses

### Technical Features
- MySQL database with proper relational schema
- Overlap prevention — never allow double bookings
- Soft deletes — historical data preserved
- Timezone-aware date handling
- Comprehensive API documentation
- Responsive UI (desktop and mobile)
- Bootstrap-based UI for quick demo

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + CSS |
| Backend | Node.js + Express |
| Database | MySQL 8.x |
| State | React Context + useState |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Calendar | FullCalendar |
| Auth | bcrypt + jsonwebtoken |
| Validation | Zod |
| Icons | Lucide React |

## Project Structure

```
campus-seminar-hall/
├── README.md                  # This file
├── PROJECT_STATE.md           # AI handoff state
├── ARCHITECTURE.md            # Full architecture doc
├── .gitignore
├── .env.example
│
├── backend/                   # Express API
│   ├── package.json
│   ├── src/
│   │   └── ... (see ARCHITECTURE.md)
│   ├── .env
│   ├── schema.sql
│   └── seed.sql
│
└── frontend/                  # React frontend
    ├── package.json
    ├── src/
    │   └── ... (see ARCHITECTURE.md)
    └── vite.config.js
```

## Getting Started

### Prerequisites

- Node.js >= v20
- MySQL 8.x running
- npm or yarn

### 1. Clone & Setup

```bash
# Clone the repo
git clone <repo-url>
cd campus-seminar-hall

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` in both backend and frontend:

```bash
# Backend .env
cd ../backend
cp .env.example .env
# Edit .env with your MySQL credentials

# Frontend .env  
cd ../frontend
cp .env.example .env
```

### 3. Database Setup

```bash
# Create the database
mysql -u root -p
CREATE DATABASE campus_seminar_hall;
EXIT;

# Initialize schema
cd backend
mysql -u root -p campus_seminar_hall < schema.sql

# Run seed data (includes institutes, halls, sample users)
mysql -u root -p campus_seminar_hall < seed.sql
```

### 4. Run the Application

```bash
# Start backend (dev mode with nodemon)
cd backend
npm run dev

# Start frontend (dev mode)
cd frontend
npm run dev

# Visit:
#   Frontend: http://localhost:5173
#   Backend API: http://localhost:5000/api
```

### 5. Demo Credentials

After seeding, default users are available. Check `seed.sql` for exact details.

---

## Current Status

| Component | Status |
|-----------|--------|
| Architecture | ✅ Complete |
| Database Schema | ⏳ Pending (Phase 2) |
| Backend Scaffold | ⏳ Pending (Phase 3) |
| Authentication | ⏳ Pending (Phase 4) |
| Hall Management | ⏳ Pending (Phase 5) |
| Booking Engine | ⏳ Pending (Phase 6) |
| Cancellation | ⏳ Pending (Phase 7) |
| Check-in/Check-out | ⏳ Pending (Phase 8) |
| Feedback | ⏳ Pending (Phase 9) |
| Reports/Dashboard | ⏳ Pending (Phase 10) |
| Frontend Pages | ⏳ Pending (Phase 11) |
| UI/UX Polish | ⏳ Pending (Phase 12) |
| Testing | ⏳ Pending (Phase 13) |
| Demo Prep | ⏳ Pending (Phase 14) |

## Roadmap

See `PROJECT_STATE.md` for detailed phase-by-phase implementation plan.

## Security

- Passwords are hashed with bcrypt
- Environment variables for secrets
- CORS restricted to frontend origin
- Rate limiting on auth endpoints
- SQL injection protection via prepared statements
- No secrets committed to Git (see .gitignore)

## License

MIT — free for educational and demo purposes.

## Contact

For questions or contributions, please open an issue or pull request.
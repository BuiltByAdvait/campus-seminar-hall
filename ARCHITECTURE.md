# Campus Seminar Hall Booking & Management System
## Complete Architecture Document

---

## 1. PROBLEM STATEMENT

Multiple institutes share a campus with a limited number of seminar halls. 
Currently, booking a hall requires manually contacting each institute — slow, 
error-prone, and leads to double bookings.

This system centralizes hall availability, booking, cancellation, check-in/out, 
feedback, and reporting.

---

## 2. TECH STACK & RATIONALE

### Frontend
- **React 18** with **Vite** — modern, fast HMR, easy to demo
- **React Router v6** — standard routing
- **Recharts** — clean, React-native charts
- **FullCalendar** — professional calendar/schedule view
- **date-fns** — modern date library, tree-shakeable
- **Zustand** — lightweight state management (no Redux overhead for college project)
- **Axios** — HTTP client with interceptors for auth
- **React Hook Form** + **Zod** — form validation
- **CSS Modules** + custom design system — avoid heavy frameworks like MUI that bloat
- **Lucide React** — clean icons

### Backend
- **Node.js** + **Express** — as specified
- **MySQL2** (promise-based driver) — direct SQL with prepared statements
- **Zod** — request validation
- **bcrypt** — password hashing
- **jsonwebtoken** — JWT auth with refresh tokens
- **cors**, **helmet**, **morgan** — standard middleware
- **dotenv** — env config
- **winston** — structured logging
- **express-rate-limit** — basic brute-force protection

### Database
- **MySQL 8.4.10** — available, ACID-compliant, well-known for college projects
- **Charset**: utf8mb4
- **Engine**: InnoDB (for transactions and FK)
- **Time zone**: store UTC, convert to local in app

### Why not PostgreSQL?
- Not installed on system, MySQL is
- Both are equally defensible; MySQL chosen for local availability

### Why not MongoDB?
- Spec explicitly requires SQL relational DB
- Need JOINs, transactions, constraints

### Why not Next.js?
- Overkill for a college demo
- API routes work but harder to explain in viva
- Separate frontend is clearer architecture

### Why not TypeScript?
- Adds complexity for college demo
- But we DO want type safety — compromise: use TS for backend, JS for frontend 
  OR full TS. **Decision: Full JavaScript with JSDoc comments for type hints** — 
  simpler to explain in viva, faster to set up.
- **Alternative decision**: Use TypeScript in BOTH for production quality. 
  **Final decision: TypeScript backend, JavaScript frontend** for balanced quality.

---

## 3. HIGH-LEVEL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Frontend (Vite)                                    │  │
│  │  - Pages, Components, Hooks                              │  │
│  │  - State (Zustand)                                       │  │
│  │  - API Client (Axios)                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP (REST + JWT)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Express Backend (Node.js)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Middleware                                              │  │
│  │  - Auth (JWT verify)                                     │  │
│  │  - Authorization (role-based)                            │  │
│  │  - Validation (Zod)                                      │  │
│  │  - Error handling                                        │  │
│  │  - Rate limiting                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Controllers / Services                                  │  │
│  │  - AuthService                                           │  │
│  │  - BookingService (with overlap detection)               │  │
│  │  - HallService                                           │  │
│  │  - CheckInOutService                                     │  │
│  │  - FeedbackService                                       │  │
│  │  - ReportService                                         │  │
│  │  - UserService                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Data Access Layer (MySQL2)                              │  │
│  │  - Repositories (one per entity)                         │  │
│  │  - Prepared statements (SQL injection safe)             │  │
│  │  - Transactions for critical ops                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ TCP (MySQL protocol)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  MySQL 8.4 Database                             │
│  - 12+ tables, 3NF normalized                                   │
│  - Foreign keys, indexes, constraints                           │
│  - Soft deletes where appropriate                               │
│  - Triggers for audit (optional)                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. FOLDER STRUCTURE

```
/Users/adismac/campus-seminar-hall/
│
├── README.md                        # Public project documentation
├── PROJECT_STATE.md                 # AI continuation state (handoff)
├── ARCHITECTURE.md                  # This file
├── .gitignore                       # Root gitignore
├── .env.example                     # Environment variable template
│
├── backend/                         # Express API
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── nodemon.json
│   │
│   ├── src/
│   │   ├── server.js                # Entry point
│   │   ├── app.js                   # Express app config
│   │   │
│   │   ├── config/
│   │   │   ├── db.js                # MySQL pool
│   │   │   ├── env.js               # Env var validation
│   │   │   └── logger.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT verify
│   │   │   ├── authorize.js         # Role check
│   │   │   ├── validate.js          # Zod validation wrapper
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimit.js
│   │   │
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.js
│   │   │   │   ├── auth.service.js
│   │   │   │   ├── auth.routes.js
│   │   │   │   └── auth.validation.js
│   │   │   │
│   │   │   ├── users/
│   │   │   │   ├── user.controller.js
│   │   │   │   ├── user.service.js
│   │   │   │   ├── user.repository.js
│   │   │   │   ├── user.routes.js
│   │   │   │   └── user.validation.js
│   │   │   │
│   │   │   ├── institutes/
│   │   │   │   ├── institute.controller.js
│   │   │   │   ├── institute.service.js
│   │   │   │   ├── institute.repository.js
│   │   │   │   ├── institute.routes.js
│   │   │   │   └── institute.validation.js
│   │   │   │
│   │   │   ├── departments/
│   │   │   │   └── (same pattern)
│   │   │   │
│   │   │   ├── halls/
│   │   │   │   └── (same pattern)
│   │   │   │
│   │   │   ├── bookings/
│   │   │   │   ├── booking.controller.js
│   │   │   │   ├── booking.service.js   # contains overlap logic
│   │   │   │   ├── booking.repository.js
│   │   │   │   ├── booking.routes.js
│   │   │   │   └── booking.validation.js
│   │   │   │
│   │   │   ├── checkinout/
│   │   │   │   └── (same pattern)
│   │   │   │
│   │   │   ├── feedback/
│   │   │   │   └── (same pattern)
│   │   │   │
│   │   │   ├── reports/
│   │   │   │   ├── report.controller.js
│   │   │   │   ├── report.service.js
│   │   │   │   └── report.routes.js
│   │   │   │
│   │   │   └── dashboard/
│   │   │       ├── dashboard.controller.js
│   │   │       ├── dashboard.service.js
│   │   │       └── dashboard.routes.js
│   │   │
│   │   ├── db/
│   │   │   ├── schema.sql              # CREATE TABLE statements
│   │   │   ├── seed.sql                # Demo data
│   │   │   ├── migrations/             # If needed
│   │   │   └── connection.js
│   │   │
│   │   ├── utils/
│   │   │   ├── jwt.js
│   │   │   ├── password.js
│   │   │   ├── date.js
│   │   │   ├── errors.js               # Custom error classes
│   │   │   └── asyncHandler.js
│   │   │
│   │   └── constants/
│   │       ├── bookingStatus.js
│   │       ├── eventTypes.js
│   │       └── userTypes.js
│   │
│   └── tests/
│       ├── booking.test.js
│       ├── auth.test.js
│       └── overlap.test.js
│
├── frontend/                          # React + Vite
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── .env.example
│   │
│   ├── public/
│   │   └── favicon.svg
│   │
│   ├── src/
│   │   ├── main.jsx                   # Entry
│   │   ├── App.jsx                    # Router root
│   │   │
│   │   ├── api/
│   │   │   ├── client.js              # Axios instance
│   │   │   ├── auth.api.js
│   │   │   ├── halls.api.js
│   │   │   ├── bookings.api.js
│   │   │   ├── reports.api.js
│   │   │   └── dashboard.api.js
│   │   │
│   │   ├── store/
│   │   │   ├── authStore.js
│   │   │   ├── uiStore.js
│   │   │   └── bookingStore.js
│   │   │
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Spinner.jsx
│   │   │   │   ├── EmptyState.jsx
│   │   │   │   ├── ErrorMessage.jsx
│   │   │   │   └── Toast.jsx
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── AdminLayout.jsx
│   │   │   │   └── UserLayout.jsx
│   │   │   │
│   │   │   ├── booking/
│   │   │   │   ├── BookingForm.jsx
│   │   │   │   ├── AvailabilityTimeline.jsx
│   │   │   │   ├── BookingCard.jsx
│   │   │   │   ├── BookingStatusBadge.jsx
│   │   │   │   ├── ConflictWarning.jsx
│   │   │   │   └── TimeSlotPicker.jsx
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── StatCard.jsx
│   │   │   │   ├── BookingTrendChart.jsx
│   │   │   │   ├── HallUtilizationChart.jsx
│   │   │   │   ├── InstituteUsageChart.jsx
│   │   │   │   ├── WeeklyHeatmap.jsx
│   │   │   │   ├── RatingChart.jsx
│   │   │   │   └── CancellationStats.jsx
│   │   │   │
│   │   │   ├── calendar/
│   │   │   │   ├── ScheduleCalendar.jsx
│   │   │   │   └── CalendarLegend.jsx
│   │   │   │
│   │   │   ├── feedback/
│   │   │   │   ├── FeedbackForm.jsx
│   │   │   │   ├── StarRating.jsx
│   │   │   │   └── FeedbackCard.jsx
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── HallForm.jsx
│   │   │       ├── InstituteForm.jsx
│   │   │       ├── UserTable.jsx
│   │   │       └── BookingTable.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   ├── Landing.jsx
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   └── NotFound.jsx
│   │   │   │
│   │   │   ├── user/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── BookHall.jsx
│   │   │   │   ├── HallAvailability.jsx
│   │   │   │   ├── MyBookings.jsx
│   │   │   │   ├── BookingDetails.jsx
│   │   │   │   ├── CheckInOut.jsx
│   │   │   │   ├── Feedback.jsx
│   │   │   │   └── Profile.jsx
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── ManageBookings.jsx
│   │   │       ├── ManageHalls.jsx
│   │   │       ├── ManageInstitutes.jsx
│   │   │       ├── ManageDepartments.jsx
│   │   │       ├── ManageUsers.jsx
│   │   │       ├── ViewFeedback.jsx
│   │   │       ├── ViewCheckInOut.jsx
│   │   │       └── Reports.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useBooking.js
│   │   │   ├── useHall.js
│   │   │   ├── useDebounce.js
│   │   │   └── useToast.js
│   │   │
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   ├── variables.css        # Design tokens
│   │   │   ├── reset.css
│   │   │   └── (component styles via CSS modules)
│   │   │
│   │   └── utils/
│   │       ├── format.js            # Date/number formatters
│   │       ├── validators.js
│   │       └── constants.js
│   │
│   └── tests/
│       └── (component tests if time)
│
└── docs/
    ├── API.md                        # API documentation
    ├── DATABASE.md                   # ERD + schema docs
    ├── USER_GUIDE.md                 # How to use the system
    ├── ARCHITECTURE_DIAGRAMS.md      # Visual diagrams
    └── DEMO_SCRIPT.md                # For viva/demo
```

---

## 5. DATABASE DESIGN (High-Level)

### 5.1 Entity-Relationship Overview

```
USERS ───< BOOKINGS >─── HALLS
  │           │
  │           ├──< CHECK_IN_OUT
  │           ├──< FEEDBACK
  │           ├──< BOOKING_STATUS_HISTORY
  │           └──< CANCELLATIONS
  │
  ├── INSTITUTES (FK)
  ├── DEPARTMENTS (FK)
  └── USER_TYPE (enum)

INSTITUTES ───< DEPARTMENTS
HALLS ───> INSTITUTES (managing institute)
EVENT_TYPES (reference table)
BOOKING_STATUS (reference / enum)
```

### 5.2 Core Tables (12)

1. **users** — accounts, auth
2. **institutes** — colleges, schools
3. **departments** — departments/branches
4. **halls** — seminar halls
5. **event_types** — seminar, workshop, etc.
6. **bookings** — main booking records
7. **booking_status_history** — audit trail
8. **cancellations** — cancellation details
9. **check_in_outs** — check-in/check-out times
10. **feedback** — user feedback
11. **admin_evaluations** — operational feedback
12. **audit_logs** — admin actions log

### 5.3 Key Design Choices

- **Timestamps**: All `*_at` columns are `TIMESTAMP` with `DEFAULT CURRENT_TIMESTAMP`
- **Soft delete**: `deleted_at TIMESTAMP NULL` on important tables
- **UUIDs vs Auto-Increment**: Use **AUTO_INCREMENT BIGINT** for primary keys
  (faster, easier to explain in viva). Public-facing IDs could be a separate
  short string column if needed.
- **JSON columns**: Use sparingly. Prefer normalized tables.
- **Indexes**: 
  - `bookings(hall_id, start_time, end_time)` for overlap query
  - `bookings(user_id, start_time)` for user history
  - `bookings(status)` for filtering
- **Constraints**:
  - `CHECK (end_time > start_time)`
  - `UNIQUE (email)` on users
  - `UNIQUE (mobile)` on users

---

## 6. CORE BOOKING ALGORITHM

### Overlap Detection (The Heart of the System)

Two time intervals overlap iff:
```
interval_A.start < interval_B.end  AND  interval_A.end > interval_B.start
```

For booking validation:
```sql
SELECT id FROM bookings
WHERE hall_id = ? 
  AND status NOT IN ('CANCELLED', 'REJECTED')
  AND start_time < ?    -- new booking's end_time
  AND end_time > ?;     -- new booking's start_time
```

### Race Condition Prevention

1. **Use DB transaction** (BEGIN ... COMMIT)
2. **Lock the hall row** with `SELECT ... FOR UPDATE` to serialize bookings for that hall
3. **Then** run the overlap query
4. **If no conflict**, insert the booking
5. **COMMIT** the transaction

This prevents two concurrent transactions from both seeing "no conflict" and 
both inserting. The lock ensures one waits for the other.

### Booked Until Edge Cases

- Booking A: 11:30 → 13:30
- Booking B: 13:30 → 15:30  → **ALLOWED** (adjacent, not overlapping)
- Booking C: 12:00 → 13:00  → **DENIED** (overlaps A)
- Booking D: 11:00 → 12:00  → **ALLOWED** (ends before A starts)

Strict inequality (`<`, `>`) ensures back-to-back bookings are allowed.

---

## 7. AUTHENTICATION & AUTHORIZATION

### Auth Flow
1. User registers → password hashed with bcrypt (12 rounds) → user created
2. User logs in → credentials checked → JWT access token (15 min) + refresh token (7 days) issued
3. Access token sent in `Authorization: Bearer <token>` header
4. Refresh endpoint issues new access token

### Authorization Roles
- `USER` — student, faculty, staff, external (default)
- `ADMIN` — full access
- `SUPER_ADMIN` — system admin (optional, can be skipped)

### Resource-Level Auth
- User can only edit own profile
- User can only cancel own bookings
- User can only check in/out own bookings
- Admin can view all, edit booking status, manage entities
- Admin can NOT impersonate users (no login-as feature for simplicity)

---

## 8. API DESIGN (RESTful)

All routes prefixed with `/api`. JSON request/response.

### Auth
- `POST   /auth/register`            — public
- `POST   /auth/login`               — public
- `POST   /auth/refresh`             — public (refresh token)
- `POST   /auth/logout`              — auth
- `GET    /auth/me`                  — auth

### Users
- `GET    /users/profile`            — auth
- `PATCH  /users/profile`            — auth
- `POST   /users/change-password`    — auth
- `GET    /users`                    — admin
- `PATCH  /users/:id/status`         — admin (activate/deactivate)

### Institutes / Departments
- `GET    /institutes`               — auth
- `POST   /institutes`               — admin
- `PATCH  /institutes/:id`           — admin
- `DELETE /institutes/:id`           — admin (soft)
- (Same pattern for `/departments`)

### Halls
- `GET    /halls`                    — auth
- `GET    /halls/:id`                — auth
- `GET    /halls/:id/availability`   — auth (date query)
- `POST   /halls`                    — admin
- `PATCH  /halls/:id`                — admin
- `DELETE /halls/:id`                — admin (soft)

### Bookings
- `POST   /bookings`                 — auth (the big one)
- `GET    /bookings`                 — auth (own bookings; admin sees all)
- `GET    /bookings/:id`             — auth (own or admin)
- `PATCH  /bookings/:id`             — auth (limited edits)
- `POST   /bookings/:id/cancel`      — auth (own)
- `POST   /bookings/:id/check-in`    — auth (own)
- `POST   /bookings/:id/check-out`   — auth (own)
- `POST   /bookings/:id/feedback`    — auth (own, after completion)
- `POST   /bookings/:id/admin-evaluation` — admin

### Reports
- `GET    /reports/user/:id`         — auth (own or admin)
- `GET    /reports/hall/:id`         — auth
- `GET    /reports/institute/:id`    — auth
- `GET    /reports/weekly`           — auth (date range)
- `GET    /reports/monthly`          — auth (date range)
- `GET    /reports/overstay`         — admin
- `GET    /reports/cancellations`    — admin

### Dashboard
- `GET    /dashboard/stats`          — auth (filtered by role)
- `GET    /dashboard/today`          — auth
- `GET    /dashboard/upcoming`       — auth
- `GET    /dashboard/admin-stats`    — admin

---

## 9. REPORTING STRATEGY

All reports are generated dynamically from DB queries. Examples:

### User Report
```sql
SELECT 
  COUNT(*) as total_bookings,
  SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
  SUM(actual_duration_minutes) as total_usage_minutes,
  AVG(feedback_rating) as avg_rating,
  SUM(CASE WHEN overstay_minutes > 0 THEN 1 ELSE 0 END) as overstays
FROM bookings b
LEFT JOIN feedback f ON f.booking_id = b.id
WHERE b.user_id = ?;
```

### Weekly Report
```sql
SELECT 
  DAYNAME(start_time) as day_of_week,
  COUNT(*) as bookings,
  SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)) as total_minutes
FROM bookings
WHERE start_time BETWEEN ? AND ?
GROUP BY DAYNAME(start_time), DAYOFWEEK(start_time)
ORDER BY DAYOFWEEK(start_time);
```

### Hall Utilization
```sql
SELECT 
  h.id, h.name,
  COUNT(b.id) as bookings_count,
  SUM(TIMESTAMPDIFF(MINUTE, b.start_time, b.end_time)) as total_minutes,
  (SUM(TIMESTAMPDIFF(MINUTE, b.start_time, b.end_time)) / 
   (TIMESTAMPDIFF(MINUTE, '2026-09-01', '2026-09-30') * 60 * 8)) * 100 
   as utilization_pct
FROM halls h
LEFT JOIN bookings b ON b.hall_id = h.id 
  AND b.start_time BETWEEN ? AND ?
  AND b.status = 'COMPLETED'
GROUP BY h.id;
```

---

## 10. FRONTEND STRATEGY

### Design System Principles
- **Color**: primary indigo/blue, neutrals, semantic (green/red/yellow/blue)
- **Typography**: Inter font, scale: 12, 14, 16, 18, 20, 24, 32, 48
- **Spacing**: 4, 8, 12, 16, 24, 32, 48, 64
- **Radius**: 4, 8, 12, 16
- **Shadows**: 3 levels (sm, md, lg)
- **Light theme by default**; dark theme optional for college demo

### Page UX
- **Dashboard** — stat cards on top, charts below, quick actions
- **Book Hall** — Step 1 select hall, Step 2 select date, Step 3 see timeline + pick time, Step 4 enter event details
- **Availability** — Timeline view of day with booked/free slots clearly marked
- **My Bookings** — Tabs: Upcoming, Active, Completed, Cancelled
- **Admin Dashboard** — same layout but with admin-relevant stats and management links

### Accessibility
- Proper semantic HTML
- ARIA labels for icons
- Focus visible on all interactive elements
- Color contrast WCAG AA
- Keyboard navigation

---

## 11. SECURITY CHECKLIST

- [x] Passwords hashed with bcrypt (12 rounds)
- [x] JWT with short expiry + refresh tokens
- [x] Parameterized queries (mysql2 prepared statements)
- [x] Zod validation on all input
- [x] CORS configured (whitelist frontend)
- [x] Helmet security headers
- [x] Rate limiting on auth endpoints
- [x] Password strength validation
- [x] No secrets in code
- [x] .env.example only, real .env gitignored
- [x] Error messages don't leak internal info

---

## 12. DEVELOPMENT ROADMAP

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Requirements + Architecture | ✅ Complete |
| 2 | Database schema + setup | 🔄 Next |
| 3 | Backend scaffold + DB connection | Pending |
| 4 | Authentication + users | Pending |
| 5 | Institutes, departments, halls | Pending |
| 6 | Booking engine + availability | Pending |
| 7 | Cancellation | Pending |
| 8 | Check-in / check-out | Pending |
| 9 | Feedback | Pending |
| 10 | Reports + analytics | Pending |
| 11 | Frontend foundation | Pending |
| 12 | Frontend pages | Pending |
| 13 | UI/UX polish | Pending |
| 14 | Testing + bug fixing | Pending |
| 15 | Documentation + demo prep | Pending |

---

## 13. IDENTIFIED ASSUMPTIONS

1. **Authentication**: Email + password login. No OAuth.
2. **Email**: Email is required and unique. No email verification in v1.
3. **Mobile**: Indian 10-digit mobile number.
4. **Time Zone**: Asia/Kolkata (IST). All DB times stored in UTC, converted in app.
5. **Booking rules**: Maximum 4-hour booking by default (configurable per hall).
6. **Booking lead time**: Must be booked at least 1 hour in advance.
7. **Cancellation policy**: Can cancel up to 30 minutes before start time.
8. **Check-in window**: From 30 minutes before start to end_time.
9. **Check-out window**: After start_time (no early checkout below start).
10. **Feedback**: Available 30 minutes after checkout.
11. **Halls**: Default operating hours 8:00 AM – 8:00 PM (configurable per hall).
12. **Admin**: Initial admin user created via seed script, not via API.
13. **Data scope**: 2 halls initially: Degree Seminar Hall, Polytechnic Seminar Hall.
14. **UI language**: English only.
15. **Browser support**: Modern evergreen browsers.

---

## 14. FUTURE IMPROVEMENTS (Not in v1)

- Email notifications
- Recurring bookings
- Resource/equipment booking within hall
- QR code check-in
- Mobile app
- Real-time updates via WebSockets
- Hall photos / virtual tour
- Multi-language support
- Calendar export (iCal)
- Approval workflow for certain event types
- Equipment management (mic, projector, etc.)

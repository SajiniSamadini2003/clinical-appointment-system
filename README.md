# CareClinic – Clinical Appointment Booking System

A full-stack clinical appointment booking system developed with the **MERN** stack (MongoDB, Express.js, React, Node.js) for an undergraduate university project. The system streamlines outpatient scheduling, connects patients with medical specialists, allows doctors to manage their consulting hours and bookings, and provides administrators with comprehensive clinical management tools.

> **Academic Evaluation Notice:** Doctor profiles featured in this project (e.g., Dr. Nethmi Perera, Dr. Kavindu Silva, Dr. Tharushi Fernando, Dr. Dilshan Jayawardena, and Dr. Shenali Wickramasinghe) are **fictional demonstration profiles** created for academic evaluation and software testing. Consultation fees are displayed in Sri Lankan Rupees (Rs.). They do not represent real-world medical practices or verified medical practitioners.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Objectives](#objectives)
- [System Roles & Features](#system-roles--features)
- [Technology Stack](#technology-stack)
- [Project Folder Structure](#project-folder-structure)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Installation & Setup](#installation--setup)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [Running the Application Locally](#running-the-application-locally)
- [Application URLs](#application-urls)
- [REST API Endpoints](#rest-api-endpoints)
- [Security Features](#security-features)
- [Testing Summary](#testing-summary)
- [Image Handling & Portrait Functionality](#image-handling--portrait-functionality)
- [Limitations & Future Enhancements](#limitations--future-enhancements)
- [License & Academic Integrity](#license--academic-integrity)

---

## Problem Statement

Traditional outpatient clinic scheduling often suffers from manual paper registers, overcrowded waiting areas, phone-based scheduling conflicts, and accidental double-bookings. Patients lack real-time visibility into doctor availability, while doctors and administrators struggle with manual schedule tracking and appointment cancellations. 

This project solves these challenges by providing a centralized web-based platform with role-based access, automated real-time slot calculation, and database-enforced double-booking prevention.

---

## Objectives

1. **Role-Based Workflows:** Implement dedicated dashboards and access permissions for `PATIENT`, `DOCTOR`, and `ADMIN` users.
2. **Dynamic Slot Management:** Allow doctors to configure working time slots and dynamically recalculate available slots when bookings occur.
3. **Double-Booking Prevention:** Guarantee schedule integrity via a multi-layered defense (frontend time-slot filtering, backend controller validation, and MongoDB partial unique compound indexes).
4. **Appointment Lifecycle Control:** Support end-to-end appointment status transitions (`PENDING` -> `CONFIRMED` -> `COMPLETED`, or `CANCELLED`).
5. **Secure Authentication:** Implement stateless JSON Web Token (JWT) authentication, password hashing with bcrypt, and protected API routes.

---

## System Roles & Features

### 1. Public Guest
- Browse the clinic homepage and informational sections.
- Search and browse doctors by name or medical specialization.
- View detailed doctor profiles (qualifications, experience, consultation fee in Rs., and biography).
- Secure user registration and login.

### 2. Patient Role (`PATIENT`)
- **Self-Registration:** Public registration automatically grants the `PATIENT` role (preventing unauthorized privilege escalation).
- **Appointment Booking:** Select an available doctor, pick a future appointment date, choose an unbooked time slot, state the consultation reason, and submit a booking request.
- **Patient Dashboard:**
  - View **Upcoming Appointments** (`PENDING` or `CONFIRMED`).
  - View **Past & Cancelled Appointments** (`COMPLETED` or `CANCELLED`).
  - **Cancel Appointments:** Cancel pending or confirmed appointments with immediate slot release.

### 3. Doctor Role (`DOCTOR`)
- **Doctor Dashboard:**
  - Real-time summary statistics (Total, Pending, Confirmed, and Completed appointments).
  - List of upcoming patient appointments with patient contact details and consultation reasons.
  - History of all past consultations with status filtering (`All`, `Pending`, `Confirmed`, `Completed`, `Cancelled`).
- **Status Management:** Confirm incoming `PENDING` bookings or mark ongoing appointments as `COMPLETED`.
- **Availability Management:** Set, add, or remove consulting time slots (in `HH:MM` 24-hour format).

### 4. Admin Role (`ADMIN`)
- **Admin Dashboard:**
  - **Doctor Management:** Create new doctor accounts (automatically generating linked `User` and `Doctor` database documents), edit doctor qualifications, fees, or specializations, and delete doctor profiles (with integrity checks preventing deletion if appointments exist).
  - **Patient Directory:** View all registered patients, their contact numbers, email addresses, and registration dates.
  - **Clinic-Wide Appointment Monitoring:** Search and filter all appointments across all doctors by patient name, doctor name, status, or date.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, React Router v6, Axios |
| **Backend** | Node.js, Express.js (v5), Cookie Parser, CORS, Dotenv |
| **Database** | MongoDB Atlas, Mongoose ODM (v9) |
| **Authentication & Security** | JSON Web Tokens (`jsonwebtoken`), bcrypt password hashing (10 salt rounds) |
| **Development Tools** | Nodemon, ESLint, Git, PowerShell / Bash |

---

## Project Folder Structure

```text
ClinicalAppointmentSystem/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB Atlas connection logic
│   ├── controllers/
│   │   ├── adminController.js       # Admin queries (patient directory)
│   │   ├── appointmentController.js # Booking, cancellation, status transitions
│   │   ├── authController.js        # Registration, login, JWT issuance
│   │   └── doctorController.js      # Doctor CRUD, availability, slot calculation
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT verification (protect) & role checks (authorizeRoles)
│   ├── models/
│   │   ├── Appointment.js           # Appointment schema with partial unique index
│   │   ├── Doctor.js                # Doctor profile schema linked to User
│   │   └── User.js                  # User credentials and role schema
│   ├── routes/
│   │   ├── adminRoutes.js           # /api/admin endpoints
│   │   ├── appointmentRoutes.js     # /api/appointments endpoints
│   │   ├── authRoutes.js            # /api/auth endpoints
│   │   ├── doctorRoutes.js          # /api/doctors endpoints
│   │   └── testRoutes.js            # /api/test verification endpoints
│   ├── utils/
│   │   ├── createAdmin.js           # CLI script to seed administrator
│   │   ├── createDemoDoctor.js      # Seed script for demo doctor
│   │   ├── createDoctorImages.js    # Generates local placeholder images
│   │   ├── listDoctors.js           # CLI doctor inspection utility
│   │   └── runUpdateDemoDoctors.js  # Seeds fictional Sri Lankan doctor profiles
│   ├── .env.example                 # Backend environment variable template
│   ├── package.json                 # Backend scripts and dependencies
│   ├── server.js                    # Express app initialization and middleware
│   ├── test-phase8.js               # Integration test: Doctor CRUD & permissions
│   ├── test-phase9.js               # Integration test: Appointment lifecycle
│   └── test-phase10.js              # Integration test: Availability & double-booking
├── frontend/
│   ├── public/
│   │   ├── doctor-placeholder.svg   # Default fallback SVG avatar
│   │   └── doctors/                 # Local demo doctor portraits
│   ├── src/
│   │   ├── components/
│   │   │   ├── DoctorCard.jsx       # Reusable doctor profile card
│   │   │   ├── Footer.jsx           # Global application footer
│   │   │   ├── LoadingSpinner.jsx   # Async loading indicator
│   │   │   ├── Navbar.jsx           # Dynamic navigation with role-based links
│   │   │   ├── PageLayout.jsx       # Shared container layout
│   │   │   └── ProtectedRoute.jsx   # Route guard checking authentication and role
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # React Context for auth state & session verification
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx   # Admin panel (Doctors, Patients, Appointments)
│   │   │   ├── DoctorDashboard.jsx  # Doctor panel (Schedule, Availability, Confirmation)
│   │   │   ├── DoctorDetails.jsx    # Doctor view with interactive date/slot booking
│   │   │   ├── Doctors.jsx          # Public doctor catalog with search
│   │   │   ├── Home.jsx             # Public landing page
│   │   │   ├── Login.jsx            # User login page
│   │   │   ├── NotFound.jsx         # 404 error page
│   │   │   ├── PatientDashboard.jsx # Patient appointment manager & history
│   │   │   └── Register.jsx         # Patient self-registration page
│   │   ├── services/
│   │   │   └── api.js               # Central Axios client with request/response interceptors
│   │   ├── utils/
│   │   │   └── dateUtils.js         # Local date and time formatting utilities
│   │   ├── App.jsx                  # Route definitions and page guards
│   │   ├── index.css                # Tailwind directives and base styles
│   │   └── main.jsx                 # React root renderer
│   ├── package.json                 # Frontend dependencies and Vite scripts
│   ├── tailwind.config.js           # Tailwind color palette and configuration
│   └── vite.config.js               # Vite build configuration
├── DATABASE_DESIGN.md               # Detailed database schemas and relationships
├── PROJECT_EXPLANATION.md           # Beginner-friendly MERN architecture guide
├── VIVA_GUIDE.md                    # 70+ technical viva questions, answers, and demo plan
└── README.md                        # Master project documentation
```

---

## Prerequisites

Before running the application locally, ensure you have installed:
- **Node.js**: `v18.x` or `v20.x` LTS
- **npm**: `v9.x` or `v10.x` (bundled with Node.js)
- **MongoDB Atlas Account**: A free cloud MongoDB cluster or a local MongoDB server (`mongodb://localhost:27017/clinical_appointments`).

---

## Environment Configuration

Both the frontend and backend require environment variable configuration files. Use the provided templates with placeholder values. **Never commit actual database credentials or JWT secrets.**

### Backend Configuration (`backend/.env`)

Create a `.env` file in the `backend/` directory:

```env
# MongoDB Atlas connection string placeholder
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database_name>?retryWrites=true&w=majority

# Backend server port
PORT=5000

# Secret key used for signing JSON Web Tokens (min. 32 characters recommended)
JWT_SECRET=your_jwt_secret_key_placeholder_change_in_production

# Frontend origin allowed for Cross-Origin Resource Sharing (CORS)
CORS_ORIGIN=http://localhost:5173

# Initial Administrator seed credentials (used by `npm run create-admin`)
ADMIN_NAME=CareClinic Administrator
ADMIN_EMAIL=admin@careclinic.lk
ADMIN_PASSWORD=your_secure_admin_password_placeholder
```

### Frontend Configuration (`frontend/.env`)

Create an optional `.env` file in the `frontend/` directory (defaults to `http://localhost:5000/api` if omitted):

```env
# Base URL for backend REST API calls
VITE_API_URL=http://localhost:5000/api
```

---

## Installation & Setup

### 1. Backend Setup

Open a terminal and navigate to the backend folder:

```bash
cd backend
npm install
```

#### Seed the Initial Administrator
Run the built-in seed utility to create your admin account in MongoDB Atlas:

```bash
npm run create-admin
```

*(Optional)* Seed fictional Sri Lankan demo doctor profiles:
```bash
node utils/runUpdateDemoDoctors.js
```

### 2. Frontend Setup

Open a separate terminal and navigate to the frontend folder:

```bash
cd frontend
npm install
```

---

## Running the Application Locally

### Step 1: Start the Backend Server
In the `backend/` directory:

```bash
npm run dev
```
*The server starts on `http://localhost:5000` with hot-reload enabled via Nodemon.*

### Step 2: Start the Frontend Client
In the `frontend/` directory:

```bash
npm run dev
```
*Vite will launch the local development server on `http://localhost:5173`.*

---

## Application URLs

| Interface | Local URL | Access Level |
| :--- | :--- | :--- |
| **Home / Landing Page** | `http://localhost:5173/` | Public |
| **Doctor Catalog** | `http://localhost:5173/doctors` | Public |
| **Doctor Profile & Booking** | `http://localhost:5173/doctors/:id` | Public view / Booking requires `PATIENT` login |
| **Login Page** | `http://localhost:5173/login` | Public |
| **Patient Registration** | `http://localhost:5173/register` | Public |
| **Patient Dashboard** | `http://localhost:5173/patient/dashboard` | `PATIENT` role only |
| **Doctor Dashboard** | `http://localhost:5173/doctor/dashboard` | `DOCTOR` role only |
| **Admin Dashboard** | `http://localhost:5173/admin/dashboard` | `ADMIN` role only |
| **Backend Health Check** | `http://localhost:5000/` | Public |

---

## REST API Endpoints

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Registers a new patient (always forces `role: 'PATIENT'`). Returns token & user. |
| `POST` | `/api/auth/login` | Public | Authenticates credentials; returns JWT token & user profile. |
| `POST` | `/api/auth/logout` | Public | Acknowledges client-side logout. |

### Doctor Routes (`/api/doctors`)
| Method | Endpoint | Access | Role Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/doctors` | Public | None | Returns list of all doctors with populated User details. |
| `GET` | `/api/doctors/:id` | Public | None | Returns single doctor profile by Doctor `_id`. |
| `GET` | `/api/doctors/:id/available-slots` | Public | None | Query params `?date=YYYY-MM-DD`. Returns unbooked slots for that date. |
| `GET` | `/api/doctors/me` | Protected | `DOCTOR` | Returns logged-in doctor's own profile and slots. |
| `PUT` | `/api/doctors/me/availability` | Protected | `DOCTOR` | Updates logged-in doctor's available time slots. |
| `POST` | `/api/doctors` | Protected | `ADMIN` | Creates a new Doctor and linked User document. |
| `PUT` | `/api/doctors/:id` | Protected | `ADMIN` | Updates an existing doctor's details and linked user name/phone. |
| `DELETE`| `/api/doctors/:id` | Protected | `ADMIN` | Deletes doctor and linked user (blocked with 409 if appointments exist). |

### Appointment Routes (`/api/appointments`)
| Method | Endpoint | Access | Role Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/appointments` | Protected | `PATIENT` | Books an appointment. Patient ID is derived from JWT. |
| `GET` | `/api/appointments/my` | Protected | `PATIENT` | Returns all appointments for the logged-in patient. |
| `GET` | `/api/appointments/doctor` | Protected | `DOCTOR` | Returns all appointments booked with the logged-in doctor. |
| `GET` | `/api/appointments/all` | Protected | `ADMIN` | Returns all appointments across all doctors and patients. |
| `GET` | `/api/appointments/:id` | Protected | Any Valid Role | Returns appointment details if requester owns or administers it. |
| `PUT` | `/api/appointments/:id/cancel` | Protected | `PATIENT` | Cancels appointment (only if `PENDING` or `CONFIRMED`). |
| `PUT` | `/api/appointments/:id/status` | Protected | `DOCTOR` | Updates status: `PENDING` -> `CONFIRMED` or `CONFIRMED` -> `COMPLETED`. |

### Admin Routes (`/api/admin`)
| Method | Endpoint | Access | Role Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/patients` | Protected | `ADMIN` | Returns list of all registered patients sorted by registration date. |

---

## Security Features

1. **Password Hashing:** Passwords are never stored in plaintext. They are salted and hashed using `bcrypt` with 10 salt rounds before persistence.
2. **Stateless JWT Authentication:** Authentication tokens expire in 24 hours (`1d`) and are signed using a server-side secret (`JWT_SECRET`).
3. **Strict Authorization Middleware:**
   - `protect`: Validates incoming `Authorization: Bearer <token>` headers, decodes the user ID, verifies user existence in MongoDB, and attaches `req.user` without the password field. Returns `401 Unauthorized` for missing or expired tokens.
   - `authorizeRoles(...roles)`: Verifies if `req.user.role` is authorized to access the specific endpoint. Returns `403 Forbidden` if unauthorized.
4. **Privilege Escalation Prevention:** The public registration endpoint (`POST /api/auth/register`) strictly sets `role: 'PATIENT'`. Administrative accounts can only be provisioned via the command-line seed script (`npm run create-admin`), and doctors can only be created by an authenticated `ADMIN`.
5. **No Token or Secret Exposure:** Passwords are excluded from database queries using Mongoose `.select('-password')`. Environment files (`.env`) are excluded via `.gitignore`.
6. **Automatic Session Expiry Handling:** An Axios response interceptor intercepts HTTP `401` errors, purges invalid localStorage credentials, and redirects the user cleanly to `/login`.

---

## Testing Summary

The system was verified using automated Node.js integration test suites executing real HTTP requests against the running Express server and MongoDB Atlas:

- **Phase 8 Test Suite (`backend/test-phase8.js`):**
  - Verified Admin login and JWT role verification.
  - Verified Doctor creation with linked User model.
  - Verified role-based route protection (non-admins receive HTTP `403` when attempting doctor creation).
  - Verified public doctor retrieval and doctor updating.
- **Phase 9 Test Suite (`backend/test-phase9.js`):**
  - Verified patient appointment creation and patient ID extraction from JWT.
  - Verified patient appointment isolation (patients cannot view other patients' bookings).
  - Verified doctor appointment retrieval and doctor-specific status transitions (`PENDING` -> `CONFIRMED` -> `COMPLETED`).
  - Verified patient cancellation workflow and prevention of cancelling `COMPLETED` appointments.
- **Phase 10 Test Suite (`backend/test-phase10.js`):**
  - Verified doctor availability updates and time regex validation (`HH:MM`).
  - Verified dynamic slot deduction: booked slots on a date are excluded from public slot queries.
  - Verified double-booking prevention: attempting to book an active slot returns HTTP `409 Conflict`.
- **Frontend Route Verification (`frontend/test-react-routes.js`):**
  - Verified server-side static rendering of all client routes (`/`, `/login`, `/register`, `/doctors`, `/patient/dashboard`, `/doctor/dashboard`, `/admin/dashboard`, and 404 `/invalid-page`).

---

## Image Handling & Portrait Functionality

- In earlier iterations, external image portrait URLs occasionally resulted in broken image links or CORS/network latency issues.
- The current implementation provides a **resilient two-tier image strategy**:
  1. **Safe Fallback SVG:** The frontend includes a local vector fallback (`/doctor-placeholder.svg`).
  2. **Error Recovery Handler:** In both [`DoctorCard.jsx`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/components/DoctorCard.jsx) and [`DoctorDetails.jsx`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/pages/DoctorDetails.jsx), the `<img>` tag implements an `onError` event listener:
     ```jsx
     onError={(e) => { 
       e.currentTarget.onerror = null; 
       e.currentTarget.src = '/doctor-placeholder.svg'; 
     }}
     ```
  3. **Local Placeholder Generator:** The script `backend/utils/createDoctorImages.js` generates static local demo portraits in `frontend/public/doctors/` for offline testing.

---

## Limitations & Future Enhancements

### Current System Limitations
1. **Single-Slot Booking:** Patients can book only one 30-to-60-minute time slot per submission.
2. **No Integrated Payment Gateway:** Consultation fees are displayed in Sri Lankan Rupees (Rs.), but financial transactions are simulated (no credit card or LankaQR payment gateway is currently attached).
3. **No External SMS / Email Notifications:** Booking confirmations are tracked in-app via the dashboard rather than via third-party SMS (Twilio/Mobitel) or email (Nodemailer/SendGrid) gateways.
4. **Local Execution Focus:** The application is configured and verified for local development. Cloud deployment configurations (e.g., Render or Netlify) require provisioning managed environment variables.

### Future Enhancements
- Integration of Sri Lankan payment gateways (e.g., PayHere or Commercial Bank IPG) for online fee settlement.
- Automated SMS and email appointment reminders 24 hours prior to scheduled consultations.
- Patient electronic medical record (EMR) uploads for attaching lab reports and prescriptions.
- Telemedicine video consultation integration via WebRTC.

---

## License & Academic Integrity

This project was designed and built solely for academic evaluation as a university undergraduate project. All demo doctor profiles and patient records are synthetic.

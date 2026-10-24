# Project Architecture and Implementation Guide

## CareClinic – Clinical Appointment Booking System

Welcome to the comprehensive, beginner-friendly architecture and code explanation for the **CareClinic Clinical Appointment Booking System**. This document provides an in-depth walkthrough of every component, layer, pattern, and design decision implemented across this full-stack university project.

---

## Table of Contents

1. [What the Project Does](#1-what-the-project-does)
2. [Why the Project Was Developed](#2-why-the-project-was-developed)
3. [What MERN Means](#3-what-mern-means)
4. [System Architecture](#4-system-architecture)
5. [React Frontend Structure](#5-react-frontend-structure)
6. [React Components](#6-react-components)
7. [React Router](#7-react-router)
8. [React Hooks](#8-react-hooks)
9. [Axios HTTP Client & Interceptors](#9-axios-http-client--interceptors)
10. [AuthContext & Session Management](#10-authcontext--session-management)
11. [Express Backend Structure](#11-express-backend-structure)
12. [Models, Controllers, and Routes](#12-models-controllers-and-routes)
13. [Middleware](#13-middleware)
14. [bcrypt Password Hashing](#14-bcrypt-password-hashing)
15. [JWT Authentication](#15-jwt-authentication)
16. [Role-Based Authorization](#16-role-based-authorization)
17. [Doctor CRUD Operations](#17-doctor-crud-operations)
18. [Patient Appointment Booking](#18-patient-appointment-booking)
19. [Doctor Availability Management](#19-doctor-availability-management)
20. [Double-Booking Prevention](#20-double-booking-prevention)
21. [Appointment Cancellation](#21-appointment-cancellation)
22. [Appointment Status Transitions](#22-appointment-status-transitions)
23. [Admin Clinical Management](#23-admin-clinical-management)
24. [Frontend-to-Backend Data Flow](#24-frontend-to-backend-data-flow)
25. [Error Handling & HTTP Status Codes](#25-error-handling--http-status-codes)
26. [Testing Strategy & Verification](#26-testing-strategy--verification)
27. [Limitations & Future Enhancements](#27-limitations--future-enhancements)

---

## 1. What the Project Does

The **CareClinic Clinical Appointment Booking System** is a web-based healthcare scheduling platform. It connects three distinct groups of users:

- **Patients** can register an account, browse medical specialists by field, view doctor profiles and consultation fees in Sri Lankan Rupees (Rs.), choose an available appointment date and time slot, and manage their consultation history.
- **Doctors** can view their daily schedule, see upcoming patient details and consultation symptoms, confirm pending appointments, mark consultations as completed, and manage their weekly available time slots.
- **Clinic Administrators** oversee the clinical directory, register and update doctor credentials, inspect registered patients, and monitor all appointments across the clinic.

---

## 2. Why the Project Was Developed

In traditional outpatient dispensaries and private practices, appointment booking is often handled manually via telephone calls or physical desk registers. This manual approach introduces major problems:
- **Scheduling Conflicts:** Staff accidentally book two patients for the same doctor at the exact same time (double-booking).
- **Waiting Room Congestion:** Patients arrive without confirmed time slots, creating long queues and extended waiting times.
- **Lack of Transparency:** Patients cannot view doctor qualifications, specialties, or consultation fees beforehand.
- **Administrative Inefficiency:** Doctors and receptionists cannot quickly view historical appointments or patient contact records.

This project was developed as an undergraduate software engineering system to demonstrate how a modern full-stack web architecture can digitize clinic workflows, enforce data integrity at the database layer, and provide responsive user experiences.

---

## 3. What MERN Means

The **MERN** stack is a popular collection of JavaScript-based technologies used to build modern, full-stack single-page web applications:

| Acronym | Technology | Layer | Role in CareClinic |
| :--- | :--- | :--- | :--- |
| **M** | **MongoDB** | Database | A NoSQL document database that stores JSON-like BSON records for users, doctors, and appointments in cloud collections. |
| **E** | **Express.js** | Backend Web Framework | A lightweight framework running on Node.js that sets up REST API endpoints, routing, request parsing, and security middleware. |
| **R** | **React** | Frontend UI Framework | A component-based JavaScript library that renders dynamic, interactive user interfaces with fast state-driven updates. |
| **N** | **Node.js** | Backend Runtime | A fast, asynchronous JavaScript runtime environment that executes backend server code outside of the browser. |

### Why use MERN?
- **Single Language (JavaScript/JSX):** Both the client application and server application are written in JavaScript, eliminating context-switching between different programming languages.
- **JSON Data Exchange:** Data flows naturally as JSON objects from MongoDB, through Express controllers, across HTTP via Axios, directly into React state variables.

---

## 4. System Architecture

CareClinic follows a **Client-Server RESTful Architecture**:

```text
+-------------------------------------------------------------+
|                     BROWSER CLIENT                          |
|  React 18 + Vite + React Router + Tailwind CSS              |
|                                                             |
|  [Pages & Components] <---> [AuthContext] <---> [Axios API] |
+-------------------------------------------------------------+
                              |
                              | HTTP / HTTPS Requests (JSON)
                              | Header: "Authorization: Bearer <JWT>"
                              v
+-------------------------------------------------------------+
|                     EXPRESS BACKEND                         |
|  Node.js + Express.js REST API                              |
|                                                             |
|  [server.js]                                                |
|       |                                                     |
|       +--> [Middleware] (express.json, CORS, protect, auth) |
|       +--> [Routes] (/api/auth, /api/doctors, etc.)         |
|       +--> [Controllers] (Business logic, validation)       |
|       +--> [Mongoose Models] (User, Doctor, Appointment)    |
+-------------------------------------------------------------+
                              |
                              | Mongoose Connection (TCP/TLS)
                              v
+-------------------------------------------------------------+
|                     DATABASE LAYER                          |
|  MongoDB Atlas Cloud Cluster                                |
|                                                             |
|  Collections: [users] [doctors] [appointments]              |
|  Indexes: Compound Partial Unique Index for Slots           |
+-------------------------------------------------------------+
```

### Key Architectural Characteristics:
1. **Stateless Backend:** The Express backend does not maintain server-side session memory. Instead, user identity is verified on every request using a signed JSON Web Token (JWT) sent in the HTTP `Authorization` header.
2. **Single Page Application (SPA):** The browser loads one HTML page (`index.html`). React Router intercepts navigation events and swaps UI components instantly without reloading the browser page.
3. **Decoupled Architecture:** The frontend and backend can be hosted independently, communicate exclusively over standard JSON REST endpoints, and be tested in isolation.

---

## 5. React Frontend Structure

The frontend lives inside [`frontend/src/`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src) and is organized cleanly by responsibility:

- [`src/components/`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/components/): Reusable UI building blocks (Navigation bar, Doctor Card, Layout container, Protected Route guard, Spinner).
- [`src/pages/`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/pages/): Full page views mapped to specific URLs (`Home.jsx`, `Doctors.jsx`, `DoctorDetails.jsx`, `PatientDashboard.jsx`, `DoctorDashboard.jsx`, `AdminDashboard.jsx`, `Login.jsx`, `Register.jsx`, `NotFound.jsx`).
- [`src/context/`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/context/): Global application state management via React Context (`AuthContext.jsx`).
- [`src/services/`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/services/): Network communication logic (`api.js` Axios instance configured with request/response interceptors).
- [`src/utils/`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/utils/): Helper functions (`dateUtils.js` for date and time formatting without external libraries).
- [`App.jsx`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/App.jsx): Top-level routing configuration and route guard declarations.
- [`main.jsx`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/main.jsx): React application entry point where `ReactDOM.createRoot` mounts `<App />` wrapped in `<BrowserRouter>` and `<AuthProvider>`.

---

## 6. React Components

React applications are built out of modular, self-contained pieces of UI called **Components**.

### Example: [`DoctorCard.jsx`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/components/DoctorCard.jsx)
The [`DoctorCard`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/components/DoctorCard.jsx#L9-L66) is a reusable presentation component. It receives a `doctor` object as a prop and renders their portrait, name, specialization, experience, formatted consultation fee in Rs., and a button linking to that doctor's individual booking page:

```jsx
const DoctorCard = ({ doctor }) => {
  const doctorName = doctor.user?.name || 'Dr. Medical Specialist';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col p-6">
      <div className="flex items-start gap-4 mb-4">
        <img
          src={doctor.profileImage || PLACEHOLDER}
          alt={doctorName}
          className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 flex-shrink-0"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER; }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-800 truncate">{doctorName}</h3>
          <span className="inline-block mt-1 px-2.5 py-0.5 bg-teal-50 text-primary text-xs font-semibold rounded-full">
            {doctor.specialization}
          </span>
        </div>
      </div>
      ...
      <Link to={`/doctors/${doctor._id}`} className="block w-full text-center bg-primary text-white py-2 rounded-lg">
        View Details
      </Link>
    </div>
  );
};
```

### Component Hierarchy:
- `<App>`
  - `<PageLayout>` (Renders `<Navbar>`, page content inside a container, and `<Footer>`)
    - `<Routes>`
      - `<Route path="/doctors" element={<Doctors />} />` $\to$ renders multiple `<DoctorCard />` components
      - `<Route path="/patient/dashboard" element={<ProtectedRoute allowedRoles={['PATIENT']}><PatientDashboard /></ProtectedRoute>} />`

---

## 7. React Router

React Router (v6) enables client-side routing, allowing users to navigate between different views without triggering a full page reload from the web server.

In [`frontend/src/App.jsx`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/App.jsx#L14-L54):
- `<Routes>` and `<Route>`: Map URL path strings to specific page components.
- `useParams`: Extracts dynamic URL parameters. In [`DoctorDetails.jsx`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/pages/DoctorDetails.jsx#L10), `const { id } = useParams()` extracts the doctor's database ID from `/doctors/:id`.
- `useNavigate`: Programmatically redirects users. In [`Login.jsx`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/pages/Login.jsx#L34-L45), upon successful authentication, `navigate(user.role === 'DOCTOR' ? '/doctor/dashboard' : ...)` directs users to their appropriate dashboard.
- `<Link>`: Renders an anchor tag that intercepts browser clicks to perform instant client-side transitions.
- `<Navigate replace />`: Used inside [`ProtectedRoute.jsx`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/components/ProtectedRoute.jsx#L26) to redirect unauthenticated visitors to `/login`.

---

## 8. React Hooks

React Hooks allow functional components to manage local state, execute lifecycle side-effects, and access shared context. The project utilizes five essential hooks:

### 1. `useState`
Manages state variables that trigger UI re-renders when updated.
```jsx
// In DoctorDetails.jsx
const [selectedDate, setSelectedDate] = useState('');
const [availableSlots, setAvailableSlots] = useState([]);
const [isBooking, setIsBooking] = useState(false);
```

### 2. `useEffect`
Executes side-effects such as asynchronous API requests when a component mounts or when specific dependencies change.
```jsx
// In Doctors.jsx: fetch doctors once when the page loads
useEffect(() => {
  fetchDoctors();
}, []); // Empty dependency array means "run once on component mount"
```

### 3. `useContext`
Accesses data from React Context without manually passing props down through multiple layers of components.
```jsx
// In DoctorCard.jsx, Navbar.jsx, PatientDashboard.jsx
const { user, isAuthenticated, logout } = useAuth();
```

### 4. `useCallback`
Memoizes a function definition so that it is not recreated on every render unless its dependencies change.
```jsx
// In DoctorDetails.jsx: memoized function to fetch available slots for a date
const fetchAvailableSlots = useCallback(async (date) => {
  if (!id || !date) return;
  const response = await api.get(`/doctors/${id}/available-slots`, { params: { date } });
  setAvailableSlots(response.data?.availableSlots || []);
}, [id]);
```

### 5. `useRef`
Holds a mutable reference that persists across re-renders without triggering a re-render when changed.
```jsx
// In DoctorDetails.jsx: tracks the most recently requested date to prevent race conditions
const activeDateRef = useRef('');
// If response arrives for an old date, it is safely ignored:
if (activeDateRef.current === date) {
  setAvailableSlots(response.data?.availableSlots || []);
}
```

---

## 9. Axios HTTP Client & Interceptors

All communication with the Express backend is managed through a single centralized Axios instance configured in [`frontend/src/services/api.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/services/api.js).

### 1. Base URL Configuration
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});
```
This enables seamless switching between local development (`http://localhost:5000/api`) and production environments using environment variables.

### 2. Request Interceptor (Attaching JWT)
Before any HTTP request leaves the browser, the request interceptor checks `localStorage` for a saved JWT token. If present, it attaches it to the `Authorization` header:
```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 3. Response Interceptor (Handling 401 Expirations)
If the backend returns an HTTP `401 Unauthorized` (for example, when a JWT has expired after 24 hours), the response interceptor automatically clears the stale token and user data from `localStorage` and redirects the browser cleanly to `/login`:
```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!localStorage.getItem('token');
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (hadToken && !isLoginRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 10. AuthContext & Session Management

Authentication state is shared across the entire React application through [`AuthContext.jsx`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/context/AuthContext.jsx).

### Key Responsibilities:
1. **Global Auth State:** Stores `user` (object), `token` (string), `loading` (boolean), and `isAuthenticated` (derived boolean).
2. **Session Persistence:** When a user logs in, their JWT and user profile are persisted to the browser's `localStorage`.
3. **Session Verification on Mount:** When the user refreshes the page, `AuthContext` reads the saved token and calls the backend `/api/test/profile` endpoint to verify that the token has not expired or been tampered with. If the backend accepts the token, fresh user data is set into state; if the backend rejects it, credentials are wiped.
4. **Role-Aware Dashboard Routing:** Provides `getDashboardPath()` to determine where each user role belongs:
   - `PATIENT` $\to$ `/patient/dashboard`
   - `DOCTOR` $\to$ `/doctor/dashboard`
   - `ADMIN` $\to$ `/admin/dashboard`

---

## 11. Express Backend Structure

The backend application is initialized in [`backend/server.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/server.js). It sets up essential middleware and routes:

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

connectDB(); // Establishes MongoDB Atlas connection

const app = express();

// Global Middleware
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(cookieParser());

// Route Mounting
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/test', require('./routes/testRoutes'));
```

---

## 12. Models, Controllers, and Routes

The backend follows the **MVC (Model-View-Controller)** pattern (with React serving as the View):

1. **Routes (`routes/*.js`):** Define the URL endpoints, HTTP methods (`GET`, `POST`, `PUT`, `DELETE`), and attach the necessary security middleware (`protect`, `authorizeRoles`).
2. **Controllers (`controllers/*.js`):** Contain the business logic, input validation, database queries, and response formatting.
3. **Models (`models/*.js`):** Define the data structure, field types, default values, references, and validation rules using Mongoose schemas.

### Why Separate Them?
Separating routes, controllers, and models creates **Separation of Concerns**. Routes only handle HTTP traffic mapping; controllers only handle business rules; models only handle data structure and database rules. This makes the codebase clean, modular, testable, and easy to maintain.

---

## 13. Middleware

Middleware functions in Express intercept the incoming HTTP request before it reaches the final controller function. They have access to `req` (request), `res` (response), and `next` (a function to pass control to the next middleware in the chain).

### The Authentication Middleware Pipeline:

```text
Incoming Request: GET /api/appointments/my
Header: "Authorization: Bearer <token>"
                      |
                      v
+-------------------------------------------------------------+
| express.json()      -> Parses JSON body into req.body       |
+-------------------------------------------------------------+
                      | next()
                      v
+-------------------------------------------------------------+
| cors()              -> Verifies origin (localhost:5173)     |
+-------------------------------------------------------------+
                      | next()
                      v
+-------------------------------------------------------------+
| protect()           -> 1. Extracts Bearer token             |
|                        2. Calls jwt.verify(token)           |
|                        3. Queries User.findById(decoded.id) |
|                        4. Attaches user to req.user         |
|                        (If invalid -> returns 401)          |
+-------------------------------------------------------------+
                      | next()
                      v
+-------------------------------------------------------------+
| authorizeRoles()    -> Checks if req.user.role === 'PATIENT'|
|                        (If mismatch -> returns 403)         |
+-------------------------------------------------------------+
                      | next()
                      v
+-------------------------------------------------------------+
| Controller Function -> getMyAppointments executes           |
+-------------------------------------------------------------+
```

---

## 14. bcrypt Password Hashing

In [`backend/controllers/authController.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/controllers/authController.js#L25-L27), user passwords are protected using the `bcrypt` cryptographic library:

```javascript
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

### How bcrypt works:
1. **Salt Generation:** A unique, random string called a **salt** is generated. Salt rounds = 10 means $2^{10} = 1024$ hashing iterations, making brute-force dictionary attacks and pre-computed rainbow table lookups computationally infeasible.
2. **One-Way Function:** Password hashing is a one-way mathematical function. It cannot be decrypted back into the original plaintext password.
3. **Password Verification:** During login, `bcrypt.compare(candidatePassword, storedHash)` hashes the candidate password with the salt embedded in the stored hash and compares the two hashes in constant time to prevent timing attacks.

---

## 15. JWT Authentication

CareClinic uses **JSON Web Tokens (JWT)** for stateless user authentication.

### Token Structure:
A JWT is a string formatted as three Base64URL-encoded segments separated by dots (`.`):
$$\text{Header} . \text{Payload} . \text{Signature}$$
- **Header:** Specifies the token type (`JWT`) and signing algorithm (`HS256`).
- **Payload:** Contains non-sensitive claims:
  ```json
  {
    "userId": "6ac70a1d582c8fc194fad353",
    "role": "PATIENT",
    "iat": 1729800000,
    "exp": 1729886400
  }
  ```
- **Signature:** Created by hashing the Header and Payload together with a secret key stored on the server (`process.env.JWT_SECRET`):
  $$\text{HMACSHA256}(\text{base64UrlEncode}(\text{Header}) + "." + \text{base64UrlEncode}(\text{Payload}), \text{JWT\_SECRET})$$

### Why JWT?
- **Stateless:** The server does not need to store active sessions in a database or Redis cache. Any backend server with the secret key can cryptographically verify the token.
- **Fast:** Identity verification requires only mathematical computation rather than a database lookup for every route check.

---

## 16. Role-Based Authorization

The application supports three distinct roles defined in [`backend/models/User.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/models/User.js#L21-L25):
- `PATIENT`: Can book appointments, view own appointments, and cancel active bookings.
- `DOCTOR`: Can view assigned patients, update consultation statuses, and set available time slots.
- `ADMIN`: Can manage doctor accounts, view the patient roster, and monitor all clinic appointments.

### Enforcement Mechanism:
In [`backend/middleware/authMiddleware.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/middleware/authMiddleware.js#L39-L50):
```javascript
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};
```
Endpoints are guarded by combining middleware:
```javascript
router.post('/doctors', protect, authorizeRoles('ADMIN'), createDoctor);
router.post('/appointments', protect, authorizeRoles('PATIENT'), createAppointment);
router.put('/appointments/:id/status', protect, authorizeRoles('DOCTOR'), updateAppointmentStatus);
```

---

## 17. Doctor CRUD Operations

Administrators have full CRUD (Create, Read, Update, Delete) management capabilities over doctor accounts:

- **Create (`POST /api/doctors`):** In [`doctorController.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/controllers/doctorController.js#L7-L76), creating a doctor requires creating **two** database records: first, a `User` record with `role: 'DOCTOR'`, and second, a `Doctor` record that references `user: user._id`.
  - *Rollback Protection:* If the doctor creation fails after the user record was created, the controller executes a cleanup deletion (`await User.findByIdAndDelete(createdUserId)`) to prevent orphaned user records.
- **Read (`GET /api/doctors` and `GET /api/doctors/:id`):** Public endpoints that populate the linked user details (`name`, `email`, `phone`) while excluding passwords.
- **Update (`PUT /api/doctors/:id`):** Allows updating specialization, qualifications, experience, fees, and slots, as well as the doctor's name or phone number on the linked user document.
- **Delete (`DELETE /api/doctors/:id`):** 
  - *Integrity Check:* The controller checks if any existing appointments reference this doctor:
    ```javascript
    const existingAppointment = await Appointment.findOne({ doctor: req.params.id });
    if (existingAppointment) {
      return res.status(409).json({ message: 'This doctor has appointment records and cannot be deleted.' });
    }
    ```
  - If no appointments exist, both the `Doctor` document and its linked `User` document are deleted.

---

## 18. Patient Appointment Booking

Booking an appointment is handled in [`appointmentController.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/controllers/appointmentController.js#L20-L93) through `POST /api/appointments`:

1. **Authentication:** The `protect` and `authorizeRoles('PATIENT')` middleware ensure only authenticated patients can book.
2. **Patient Identity:** The patient ID is **never trusted from the request body**. It is securely taken from `req.user._id` (derived from the verified JWT token).
3. **Input Validation:**
   - Verifies doctor ID format using `mongoose.Types.ObjectId.isValid()`.
   - Validates date format against `YYYY-MM-DD` and verifies the date is not in the past.
   - Validates time format against `HH:MM` (24-hour).
   - Verifies the selected time is part of the doctor's configured `availableSlots`.
4. **Availability Verification:** Checks if an active appointment (`PENDING` or `CONFIRMED`) already exists for that doctor, date, and time.
5. **Creation:** Saves the appointment with default status `PENDING`.

---

## 19. Doctor Availability Management

Each doctor has an `availableSlots` array of strings representing consultation start times in 24-hour format (e.g., `["09:00", "09:30", "10:00", "14:00"]`).

### Doctor Profile Update:
Doctors manage their hours via `PUT /api/doctors/me/availability`:
- Input is validated against a strict 24-hour regex: `/^([01]\d|2[0-3]):([0-5]\d)$/`.
- Duplicate slots are removed using JavaScript `Set`.
- Slots are automatically sorted chronologically before saving.

### Dynamic Slot Availability Calculation:
When a patient selects a date on the doctor booking page, the frontend calls `GET /api/doctors/:id/available-slots?date=YYYY-MM-DD`. In [`doctorController.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/controllers/doctorController.js#L206-L236):
```javascript
// 1. Doctor's standard configured slots
const configuredSlots = doctor.availableSlots || [];

// 2. Find all active bookings on that specific date
const booked = await Appointment.find({
  doctor: doctor._id,
  date,
  status: { $in: ['PENDING', 'CONFIRMED'] }
}).select('time');

const bookedTimes = booked.map(a => a.time);

// 3. Subtract booked times from configured slots
const availableSlots = configuredSlots.filter(slot => !bookedTimes.includes(slot));

res.status(200).json({ doctor: doctor._id, date, availableSlots });
```
This ensures that as soon as a slot is booked, it disappears from the available options for other patients on that date.

---

## 20. Double-Booking Prevention

CareClinic implements a **Three-Tier Defense Architecture** to guarantee that two patients cannot book the same doctor at the same time:

```text
+-------------------------------------------------------------+
| Tier 1: Frontend Client Filtering                           |
| Queries /api/doctors/:id/available-slots for selected date. |
| Already-booked slots are filtered out of the dropdown/grid. |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| Tier 2: Controller Active Record Check                      |
| Appointment.findOne({ doctor, date, time,                   |
|                       status: { $in: ['PENDING', 'CONFIRMED'] } })
| If record exists -> returns HTTP 409 Conflict.              |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| Tier 3: MongoDB Partial Unique Compound Index               |
| Index: { doctor: 1, date: 1, time: 1 }                      |
| Filter: { status: { $in: ['PENDING', 'CONFIRMED'] } }       |
| Database hardware lock rejects concurrent race conditions!  |
| Controller catches MongoDB error 11000 -> returns HTTP 409. |
+-------------------------------------------------------------+
```

### The Partial Unique Index in [`Appointment.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/models/Appointment.js#L38-L44):
```javascript
appointmentSchema.index(
  { doctor: 1, date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['PENDING', 'CONFIRMED'] } },
  }
);
```

### Why a "Partial" Unique Index?
If we used a standard unique index on `{ doctor, date, time }`, a patient would never be able to re-book a slot if an earlier appointment at that time was cancelled! 

With a **partial unique index**, the uniqueness constraint applies **only** to active appointments (`PENDING` or `CONFIRMED`). If an appointment is `CANCELLED`, MongoDB excludes it from the index constraint, allowing the slot to be booked again immediately while preserving the cancelled record in the database for clinic audit logs.

---

## 21. Appointment Cancellation

In [`appointmentController.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/controllers/appointmentController.js#L139-L161), patients can cancel bookings via `PUT /api/appointments/:id/cancel`:

- **Ownership Check:** The system verifies that `appointment.patient.toString() === req.user._id.toString()`. A patient cannot cancel someone else's appointment (returns `403 Forbidden`).
- **Completion Check:** If the status is already `COMPLETED`, cancellation is blocked:
  ```javascript
  if (appointment.status === 'COMPLETED') {
    return res.status(400).json({ message: 'Completed appointments cannot be cancelled' });
  }
  ```
- **Idempotency:** If the appointment is already `CANCELLED`, it returns a friendly confirmation without error.
- **Status Update:** The status is updated to `CANCELLED`. This instantly releases the time slot for other patients.

---

## 22. Appointment Status Transitions

CareClinic models the appointment lifecycle as a formal finite state machine:

```text
               +--------------------------------------+
               |               PENDING                |
               +--------------------------------------+
                 /                                  \
                / Doctor confirms                    \ Patient cancels
               v                                      v
+-----------------------------+         +-----------------------------+
|          CONFIRMED          |         |          CANCELLED          |
+-----------------------------+         |       (Terminal State)      |
   |                         \          +-----------------------------+
   | Doctor marks completed   \ Patient cancels
   v                           v
+-----------------------------+
|          COMPLETED          |
|       (Terminal State)      |
+-----------------------------+
```

### State Transition Rules:
1. Every new appointment starts as `PENDING`.
2. A doctor can transition an appointment from `PENDING` $\to$ `CONFIRMED`.
3. A doctor can transition an appointment from `CONFIRMED` $\to$ `COMPLETED`.
4. A patient can transition an appointment from `PENDING` $\to$ `CANCELLED` or from `CONFIRMED` $\to$ `CANCELLED`.
5. `COMPLETED` and `CANCELLED` are **terminal states**. Once an appointment is marked completed or cancelled, its status cannot be modified.

---

## 23. Admin Clinical Management

The Administrator Dashboard ([`AdminDashboard.jsx`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/pages/AdminDashboard.jsx)) provides high-level operational tools:

- **Doctor Roster Management:** Displays all doctors, qualifications, fees, and contact details. Provides interactive modal dialogs for registering new doctors and editing existing doctor profiles.
- **Patient Directory (`GET /api/admin/patients`):** Queries registered users with `role: 'PATIENT'`, showing registration dates and contact numbers.
- **Clinic-Wide Appointment Monitoring (`GET /api/appointments/all`):** Aggregates every booking across all doctors, displaying real-time patient names, doctor names, consultation dates, fees, and statuses with dynamic search and filter capabilities.

---

## 24. Frontend-to-Backend Data Flow

Here is the complete, step-by-step trace of what happens when a patient clicks **"Confirm Appointment"**:

1. **User Action:** The patient selects an available date and time slot and clicks submit in [`DoctorDetails.jsx`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/pages/DoctorDetails.jsx#L118-L156).
2. **Form Validation:** React verifies that date, time, and consultation reason are filled in.
3. **Axios Dispatch:** React calls `api.post('/appointments', { doctor: id, date, time, reason })`.
4. **Axios Interceptor:** The request interceptor in [`api.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/services/api.js#L15-L21) reads the JWT token from `localStorage` and attaches `Authorization: Bearer <token>` to the HTTP headers.
5. **Network Request:** The browser sends an HTTP POST request to `http://localhost:5000/api/appointments`.
6. **Express Server:** [`server.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/server.js#L24) routes the request to `appointmentRoutes.js`.
7. **Protect Middleware:** [`authMiddleware.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/middleware/authMiddleware.js#L4-L37) verifies the JWT using `jwt.verify()` and attaches the patient's record to `req.user`.
8. **Role Authorization:** `authorizeRoles('PATIENT')` confirms `req.user.role === 'PATIENT'`.
9. **Controller Execution:** [`appointmentController.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/controllers/appointmentController.js#L20-L93):
   - Validates date and time format.
   - Verifies the slot is listed in the doctor's `availableSlots`.
   - Checks MongoDB for active bookings at that time.
   - Calls `Appointment.create({ patient: req.user._id, doctor, date, time, reason, status: 'PENDING' })`.
10. **Database Insertion:** MongoDB checks the partial unique compound index. If clear, it writes the BSON document and generates an `_id`.
11. **Population & Response:** The controller populates doctor and user details and returns HTTP `201 Created` with the new appointment JSON.
12. **UI State Update:** React receives the HTTP 201 response, displays a success notification, clears the booking inputs, and calls `fetchAvailableSlots(selectedDate)` to refresh the available slots list in the browser.

---

## 25. Error Handling & HTTP Status Codes

The project adheres to REST standards by returning appropriate HTTP status codes:

| HTTP Status | Description | Project Example |
| :--- | :--- | :--- |
| **`200 OK`** | Request succeeded | Fetching doctors (`GET /api/doctors`), updating availability (`PUT /api/doctors/me/availability`). |
| **`201 Created`** | Resource successfully created | Patient registration (`POST /api/auth/register`), appointment booking (`POST /api/appointments`). |
| **`400 Bad Request`** | Invalid input or business logic violation | Missing required fields, invalid date format, attempting to cancel a `COMPLETED` appointment. |
| **`401 Unauthorized`** | Authentication failure | Missing, expired, or invalid JWT token; incorrect email or password during login. |
| **`403 Forbidden`** | Authorization failure | Patient attempting to access `/api/doctors/me/availability` (doctor only); patient attempting to view another patient's appointment. |
| **`404 Not Found`** | Resource does not exist | Requesting a doctor ID or appointment ID that does not exist in the database. |
| **`409 Conflict`** | Resource conflict | Slot already booked (double-booking attempt); attempting to delete a doctor who has existing appointments. |
| **`500 Internal Error`** | Unhandled server exception | Database connection failure or unhandled exception (caught cleanly via try/catch blocks). |

---

## 26. Testing Strategy & Verification

The CareClinic system was validated through four automated integration test suites running against the live server and MongoDB Atlas:

1. **`backend/test-phase8.js` (Doctor Management & RBAC):**
   - Verified administrator authentication.
   - Tested creation of doctors and linked user accounts.
   - Verified that non-admin users receive HTTP `403` when attempting to create doctors.
   - Verified doctor retrieval and profile updates.
2. **`backend/test-phase9.js` (Appointment Lifecycle):**
   - Verified patient appointment creation and patient ID binding from JWT.
   - Tested appointment data isolation between different patients.
   - Tested doctor-driven status transitions (`PENDING` $\to$ `CONFIRMED` $\to$ `COMPLETED`).
   - Verified patient cancellation and blocked cancellation on completed appointments.
3. **`backend/test-phase10.js` (Availability & Double-Booking):**
   - Tested doctor availability slot updates and time regex validation.
   - Verified dynamic slot deduction: booked slots on a date are excluded from public slot queries.
   - Tested double-booking prevention: attempting to book an active slot returns HTTP `409 Conflict`.
4. **`frontend/test-react-routes.js` (Frontend Route Verification):**
   - Tested static server-side rendering of all client routes using React Router's `StaticRouter`.

---

## 27. Limitations & Future Enhancements

### Current System Limitations:
1. **Single Time Slot per Booking:** Appointments are booked for individual discrete time slots; recurring appointments are not supported.
2. **Simulated Payments:** Consultation fees are displayed in Sri Lankan Rupees (Rs.), but financial settlement is simulated (no live payment gateway is attached).
3. **In-App Notifications Only:** Notifications and confirmations are visible within the patient and doctor dashboards rather than via external SMS or email gateways.
4. **Portrait Image Fallback:** While profile images are supported, external URLs can suffer from third-party latency. The app relies on a local vector placeholder (`/doctor-placeholder.svg`) for fallback.
5. **Local Development Configuration:** The system is verified for local development execution.

### Future Enhancements:
- **Payment Gateway Integration:** Integrating an IPG such as PayHere or Stripe to process card payments and LankaQR transactions during booking.
- **SMS & Email Alerts:** Utilizing Twilio or Nodemailer to dispatch booking confirmations and reminder alerts 24 hours prior to consultations.
- **Prescription & Lab Report Uploads:** Enabling doctors to attach digital prescriptions and patients to upload PDF diagnostic reports.
- **Telemedicine Integration:** Embedding WebRTC video consultations directly inside the appointment details view.

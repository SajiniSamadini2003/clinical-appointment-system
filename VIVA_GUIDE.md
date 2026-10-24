# Viva Voce Examination Guide & Defense Preparation

## CareClinic – Clinical Appointment Booking System

This guide is designed to prepare you for your undergraduate technical viva voce examination. It includes a 2-minute introduction to memorize, a 5-minute live demo script, high-value source code files to show examiners, common viva traps to avoid, in-depth architectural explanations, and **70 technical viva questions with short, simple answers**.

---

## Table of Contents

1. [2-Minute Project Introduction (Memorize This)](#1-2-minute-project-introduction-memorize-this)
2. [5-Minute Live Demonstration Plan](#2-5-minute-live-demonstration-plan)
3. [Important Source Code Files to Show Examiners](#3-important-source-code-files-to-show-examiners)
4. [In-Depth Explanations for Common Examiner Questions](#4-in-depth-explanations-for-common-examiner-questions)
   - [Why User and Doctor models are separate](#why-the-user-and-doctor-models-are-separate)
   - [Why patients cannot register as ADMIN](#why-patients-cannot-register-as-admin)
   - [How doctor availability works](#how-doctor-availability-works)
   - [Explanation of HTTP 400, 401, 403, 404, and 409](#explanation-of-http-400-401-403-404-and-409)
   - [How appointments are confirmed and completed](#how-appointments-are-confirmed-and-completed)
5. [Common Mistakes & How to Answer Difficult Questions](#5-common-mistakes--how-to-answer-difficult-questions)
6. [70 Technical Viva Questions and Short Answers](#6-70-technical-viva-questions-and-short-answers)
   - [A. Project Overview (Q1–Q5)](#a-project-overview)
   - [B. MERN Stack Fundamentals (Q6–Q10)](#b-mern-stack-fundamentals)
   - [C. React & Frontend Architecture (Q11–Q16)](#c-react--frontend-architecture)
   - [D. Node.js & Express Backend (Q17–Q22)](#d-nodejs--express-backend)
   - [E. MongoDB & Mongoose (Q23–Q28)](#e-mongodb--mongoose)
   - [F. JWT & bcrypt Security (Q29–Q34)](#f-jwt--bcrypt-security)
   - [G. Authentication & Authorization (Q35–Q40)](#g-authentication--authorization)
   - [H. Doctor Management (Q41–Q46)](#h-doctor-management)
   - [I. Appointment Booking (Q47–Q52)](#i-appointment-booking)
   - [J. Availability & Double-Booking Prevention (Q53–Q58)](#j-availability--double-booking-prevention)
   - [K. Testing & Quality Assurance (Q59–Q62)](#k-testing--quality-assurance)
   - [L. Git & Version Control (Q63–Q66)](#l-git--version-control)
   - [M. Limitations & Future Scope (Q67–Q70)](#m-limitations--future-scope)

---

## 1. 2-Minute Project Introduction (Memorize This)

> "Good morning, respected examiners. My project is **CareClinic**, a full-stack Clinical Appointment Booking System built using the **MERN** stack—MongoDB, Express.js, React, and Node.js.
> 
> In conventional outpatient dispensaries and clinics, scheduling is often conducted using manual paper registers or phone calls, leading to human error, double-booked time slots, and crowded waiting rooms. 
> 
> My system addresses this problem through a secure, role-based web platform supporting three distinct user roles: **Patients**, **Doctors**, and **Administrators**.
> 
> A key technical highlight of CareClinic is its **Three-Tier Double-Booking Prevention Architecture**. When a patient selects an appointment date, the frontend dynamically fetches and displays only available, unbooked slots. If two patients attempt to submit the same slot simultaneously, the Express controller validates slot availability, and MongoDB guarantees uniqueness at the hardware level using a **Compound Partial Unique Index** on `{ doctor, date, time }` filtered for active appointments.
> 
> On the security side, passwords are salted and hashed using **bcrypt** with 10 rounds, and authentication is managed through stateless **JSON Web Tokens (JWT)** with role-based route protection middleware.
> 
> The application has been fully tested using automated Node.js integration test suites covering authentication, appointment lifecycles, and slot calculations. Thank you, and I look forward to your questions."

---

## 2. 5-Minute Live Demonstration Plan

Follow this exact sequence during your live software demonstration:

| Minute | Step & Action | Key Screen / URL | What to Highlight to Examiners |
| :---: | :--- | :--- | :--- |
| **0:00 - 1:00** | **Public Catalog & Search** | `http://localhost:5173/doctors` | Show the responsive doctor grid. Type in the search box (e.g., `"Cardiology"` or `"Kavindu"`). Show how the list filters instantly in React state. Highlight consultation fees displayed in Sri Lankan Rupees (Rs.). |
| **1:00 - 2:00** | **Patient Registration & Booking** | `http://localhost:5173/register`<br>`http://localhost:5173/doctors/:id` | Register a new patient. Show that public registration automatically assigns `PATIENT` role. Navigate to Dr. Kavindu Silva. Pick tomorrow's date. Notice the time slots load dynamically. Select `10:00 AM`, enter a reason, and click **Confirm Appointment**. |
| **2:00 - 3:00** | **Double-Booking Proof** | `http://localhost:5173/doctors/:id` | Refresh or re-select tomorrow's date on the same doctor. Show the examiners that `10:00 AM` has disappeared from the available slots! Explain the dynamic subtraction logic. |
| **3:00 - 4:00** | **Doctor Dashboard & Confirmation** | `http://localhost:5173/login`<br>`/doctor/dashboard` | Log in as the doctor (`kavindu.doctor@clinic.com`). Show the **Upcoming Appointments** queue. Point out the `PENDING` booking just made. Click **Confirm**. Status updates to `CONFIRMED`. Show the **Availability Manager** where doctors can add or remove slots. |
| **4:00 - 5:00** | **Admin Dashboard & Cancellation** | `http://localhost:5173/admin/dashboard`<br>`/patient/dashboard` | Log in as Admin. Show the three tabs: **Doctors**, **Patients**, and **All Appointments**. Switch to patient dashboard to demonstrate cancellation: click **Cancel**. Status becomes `CANCELLED`. Explain how the slot is immediately released for others. |

---

## 3. Important Source Code Files to Show Examiners

When asked to open specific code files, open these files and highlight these exact line numbers:

1. **[`backend/models/Appointment.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/models/Appointment.js#L37-L44):**
   - *Lines 37–44:* Show the **Compound Partial Unique Index**:
     ```javascript
     appointmentSchema.index(
       { doctor: 1, date: 1, time: 1 },
       { unique: true, partialFilterExpression: { status: { $in: ['PENDING', 'CONFIRMED'] } } }
     );
     ```
   - *Examiner Tip:* Point out that `CANCELLED` is excluded so cancelled slots can be re-booked!

2. **[`backend/controllers/appointmentController.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/controllers/appointmentController.js#L64-L89):**
   - *Lines 64–73:* Show the pre-check query `Appointment.findOne` for existing active bookings.
   - *Lines 86–89:* Show how MongoDB duplicate key error code `11000` is caught and returned as HTTP `409 Conflict`.
   - *Lines 181–224:* Show `updateAppointmentStatus`: enforces `PENDING` $\to$ `CONFIRMED` $\to$ `COMPLETED` and blocks changes to terminal states.

3. **[`backend/controllers/doctorController.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/controllers/doctorController.js#L206-L236):**
   - *Lines 221–231:* Show the `getAvailableSlots` function: takes doctor's configured slots and filters out active booked times using array `.filter()`.
   - *Lines 159–163:* Show doctor deletion safety check: returns HTTP `409` if appointments exist.

4. **[`backend/middleware/authMiddleware.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/middleware/authMiddleware.js#L4-L50):**
   - *Lines 4–37:* Show the `protect` middleware extracting the Bearer token and verifying it with `jwt.verify()`.
   - *Lines 39–50:* Show `authorizeRoles(...roles)` checking permissions and returning HTTP `403`.

5. **[`backend/controllers/authController.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/controllers/authController.js#L25-L38):**
   - *Lines 26–27:* Show bcrypt hashing with 10 salt rounds.
   - *Line 35:* Show forced `role: 'PATIENT'` on registration.

6. **[`frontend/src/services/api.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/services/api.js#L15-L48):**
   - *Lines 15–21:* Show the Axios request interceptor injecting `Authorization: Bearer <token>`.
   - *Lines 32–48:* Show the response interceptor redirecting to `/login` on HTTP `401`.

7. **[`frontend/src/components/ProtectedRoute.jsx`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/frontend/src/components/ProtectedRoute.jsx#L9-L37):**
   - *Lines 24–32:* Show how unauthenticated visitors are redirected to `/login`, and unauthorized roles are redirected to their own dashboard.

---

## 4. In-Depth Explanations for Common Examiner Questions

### Why the User and Doctor models are separate
In CareClinic, credentials and basic user identity live in [`User.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/models/User.js), while medical qualifications, fees, and slots live in [`Doctor.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/models/Doctor.js).
- **Separation of Concerns:** Patients and Admins do not have clinical qualifications, consultation fees, or slot schedules. Cramming doctor-specific fields into the `User` schema would result in sparsely populated documents with many `null` or unused fields for non-doctors.
- **Security & Modularity:** User authentication logic (`email`, `password`, `role`) remains clean and unified across all roles. The `Doctor` schema simply references `user: ObjectId` with `unique: true`.

### Why patients cannot register as ADMIN
In [`authController.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/controllers/authController.js#L29-L36), the registration controller explicitly ignores any role submitted by the client and hardcodes `role: 'PATIENT'`:
```javascript
const user = new User({
  name,
  email,
  password: hashedPassword,
  phone,
  role: 'PATIENT' // Hardcoded: Client cannot overwrite this!
});
```
This prevents **Privilege Escalation Attacks**. An attacker cannot send `{ "role": "ADMIN" }` in a POST request to gain administrative powers. Administrators can only be provisioned through secure command-line scripts (`npm run create-admin`), and doctors can only be provisioned by an authenticated Admin.

### How doctor availability works
Doctor availability operates in two stages:
1. **Doctor Configuration:** A doctor sets recurring time slots in 24-hour format (e.g., `["09:00", "09:30", "10:00"]`) stored in `doctor.availableSlots`.
2. **Dynamic Slot Subtraction:** When a patient queries available slots for a specific date (`GET /api/doctors/:id/available-slots?date=YYYY-MM-DD`), the server fetches all active appointments (`PENDING` or `CONFIRMED`) for that doctor on that date, extracts their booked times, and subtracts them from the doctor's configured slots. Only unbooked times are returned to the patient.

### Explanation of HTTP 400, 401, 403, 404, and 409
- **`400 Bad Request`:** Client sent invalid data (e.g., missing required fields, invalid date format, or attempting to cancel an already completed appointment).
- **`401 Unauthorized`:** Authentication failure. The client has not identified itself (e.g., missing token, expired token, or invalid login credentials).
- **`402 / 403 Forbidden`:** Authorization failure. The client is authenticated, but their role does not have permission to access the resource (e.g., a Patient trying to access the Doctor dashboard).
- **`404 Not Found`:** The requested endpoint or database resource does not exist (e.g., invalid doctor ID).
- **`409 Conflict`:** Business state conflict (e.g., double-booking attempt on an already reserved slot, or attempting to delete a doctor who has existing appointments).

### How appointments are confirmed and completed
Appointments follow a strict state machine implemented in [`appointmentController.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/controllers/appointmentController.js#L181-L224):
- When booked by a patient, an appointment is saved with status `PENDING`.
- The doctor reviews their queue on the Doctor Dashboard and clicks **Confirm**. The controller validates that the appointment is currently `PENDING` and transitions it to `CONFIRMED`.
- Once the medical consultation has concluded, the doctor clicks **Mark Completed**. The controller validates that the appointment is currently `CONFIRMED` and transitions it to `COMPLETED`.
- Both `COMPLETED` and `CANCELLED` are terminal states; no further status transitions are allowed.

---

## 5. Common Mistakes & How to Answer Difficult Questions

| Difficult Question / Trap | Bad Answer | Good Answer |
| :--- | :--- | :--- |
| **"Are your doctor images and doctor profiles real doctors?"** | *"Yes, these are real licensed Sri Lankan doctors."* | **"No, sir/madam. These are fictional demonstration profiles created for software evaluation. Their names, specialties, and portrait placeholders are used solely to test search, pricing in Rs., and scheduling."** |
| **"Where is your system deployed publicly?"** | *"It's live on the cloud everywhere."* (if not verified) | **"The system is architected for cloud deployment, but for today's evaluation, it is running in a fully verified local development environment on Node.js port 5000 and Vite port 5173 with a live MongoDB Atlas cloud database."** |
| **"What happens if two patients click book at the exact same millisecond?"** | *"The frontend stops it."* | **"The frontend only filters UI slots, but concurrent race conditions bypass the UI. At the backend, MongoDB resolves the race condition using a Compound Partial Unique Index with database-level write locks. The first request succeeds; the second request throws error 11000, which our controller returns as HTTP 409 Conflict."** |
| **"Why do you store passwords with bcrypt rather than encrypting them?"** | *"Because bcrypt is a strong encryption algorithm."* | **"Bcrypt is a one-way hashing algorithm, not encryption. Encryption is two-way and can be decrypted if a key is compromised. Hashing is mathematically irreversible, ensuring that even administrators cannot read user passwords."** |
| **"Why do you store appointment dates as `YYYY-MM-DD` strings instead of MongoDB `Date` objects?"** | *"I didn't know how to use Date objects."* | **"JavaScript and MongoDB `Date` objects store UTC timestamps. In outpatient clinics, converting across time zones can shift a booking from tomorrow morning to late tonight. Storing `YYYY-MM-DD` as an ISO string guarantees exact calendar day matching without timezone shifting bugs."** |

---

## 6. 70 Technical Viva Questions and Short Answers

### A. Project Overview

**Q1: What is the primary purpose of the CareClinic system?**  
**A:** To provide an automated, role-based platform for booking outpatient doctor appointments, eliminating manual scheduling conflicts and double-bookings.

**Q2: Who are the three types of users supported in your system?**  
**A:** `PATIENT` (books and views appointments), `DOCTOR` (manages schedule and confirms bookings), and `ADMIN` (manages doctor directory and clinical oversight).

**Q3: In what currency are the doctor consultation fees displayed?**  
**A:** Sri Lankan Rupees (Rs.), formatted using the `'en-LK'` locale string.

**Q4: How does a guest user find a doctor in your system?**  
**A:** Guests can visit the `/doctors` page to browse the catalog or use the real-time search bar to filter doctors by name or medical specialization.

**Q5: What are the main benefits of CareClinic over traditional paper registers?**  
**A:** 24/7 self-service booking for patients, real-time doctor availability calculation, database-enforced double-booking prevention, and instant appointment status tracking.

---

### B. MERN Stack Fundamentals

**Q6: What does MERN stand for?**  
**A:** **M**ongoDB (database), **E**xpress.js (backend web framework), **R**eact (frontend UI library), and **N**ode.js (JavaScript runtime).

**Q7: What is the main advantage of using the MERN stack?**  
**A:** Single-language development (JavaScript/JSX throughout client and server) and native JSON data interchange between all layers.

**Q8: What is the difference between Node.js and Express.js?**  
**A:** Node.js is the runtime environment that executes JavaScript on the server; Express.js is a lightweight web framework running on Node.js to manage routing, middleware, and HTTP requests.

**Q9: What is Vite and why did you choose it over Create React App?**  
**A:** Vite is a modern frontend build tool that leverages native ES modules in the browser, providing near-instant server start and significantly faster Hot Module Replacement (HMR).

**Q10: Is your application a Multi-Page Application or a Single-Page Application?**  
**A:** It is a Single-Page Application (SPA). The browser loads one HTML page, and React Router dynamically swaps view components without reloading the browser.

---

### C. React & Frontend Architecture

**Q11: What is a React component?**  
**A:** A reusable, independent function that returns JSX markup describing a portion of the user interface based on props and state.

**Q12: What is the difference between props and state in React?**  
**A:** `props` are read-only inputs passed from a parent component; `state` is internal data managed within the component that triggers a re-render when updated.

**Q13: What does the `useState` hook do?**  
**A:** It declares a state variable and an updater function inside a functional component (e.g., `const [date, setDate] = useState('')`).

**Q14: What does the `useEffect` hook do in your application?**  
**A:** It performs asynchronous side-effects, such as fetching doctor records or appointment lists from the backend REST API when a component mounts.

**Q15: Why did you use `useCallback` in `DoctorDetails.jsx`?**  
**A:** To memoize the `fetchAvailableSlots` function so it is not unnecessarily re-instantiated on every render cycle.

**Q16: How does `ProtectedRoute.jsx` secure frontend routes?**  
**A:** It checks `isAuthenticated` and `user.role` from `AuthContext`. If unauthenticated, it redirects to `/login`; if the user has the wrong role, it redirects to their designated dashboard.

---

### D. Node.js & Express Backend

**Q17: What is middleware in Express?**  
**A:** A function that receives `req`, `res`, and `next`, capable of inspecting or modifying the request, executing code, or ending the request-response cycle.

**Q18: What does `express.json()` middleware do in `server.js`?**  
**A:** It automatically parses incoming HTTP requests with `Content-Type: application/json` and places the parsed object into `req.body`.

**Q19: What is CORS and why is it necessary?**  
**A:** Cross-Origin Resource Sharing. It is a browser security mechanism; the `cors` package configures headers allowing our React frontend (`localhost:5173`) to call our Express backend (`localhost:5000`).

**Q20: Why do you separate routes and controllers?**  
**A:** To maintain Separation of Concerns. Route files define HTTP methods and endpoint paths; controller files contain the actual business logic and database operations.

**Q21: How do you read environment variables in Node.js?**  
**A:** Using the `dotenv` package (`require('dotenv').config()`), which loads key-value pairs from `.env` into `process.env`.

**Q22: What is the role of `server.js`?**  
**A:** It is the entry point that initializes the Express app, connects to MongoDB Atlas, attaches global middleware, mounts API route handlers, and starts the HTTP listener on port 5000.

---

### E. MongoDB & Mongoose

**Q23: What is the difference between a MongoDB collection and a document?**  
**A:** A collection is a grouping of records (equivalent to a SQL table); a document is a single BSON data record inside a collection (equivalent to a SQL row).

**Q24: What is Mongoose?**  
**A:** Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js that provides schema validation, type casting, middleware, and query building.

**Q25: What is an `ObjectId` in MongoDB?**  
**A:** A unique 12-byte binary primary key automatically generated by MongoDB, encoding timestamp, machine ID, process ID, and an auto-incrementing counter.

**Q26: What does the Mongoose `.populate()` method do?**  
**A:** It automatically substitutes a referenced `ObjectId` in a document with the actual referenced document from another collection (similar to an application-level SQL JOIN).

**Q27: What does `{ timestamps: true }` in your schemas do?**  
**A:** It automatically adds and manages `createdAt` and `updatedAt` Date fields on every document.

**Q28: Why do you use `.select('-password')` when fetching user records?**  
**A:** To ensure that password hashes are stripped from database query results before they can be sent across the network to the client.

---

### F. JWT & bcrypt Security

**Q29: What is bcrypt and how does it work?**  
**A:** A cryptographic password-hashing function using salt rounds to produce a one-way, irreversible hash that protects against rainbow table and brute-force attacks.

**Q30: What are "salt rounds" in bcrypt?**  
**A:** A cost factor determining how many hashing rounds ($2^{\text{rounds}}$) are executed. We use 10 rounds ($1024$ iterations) for a balanced tradeoff between security and performance.

**Q31: What is a JSON Web Token (JWT)?**  
**A:** A compact, URL-safe token consisting of three Base64URL parts—Header, Payload, and Signature—used for securely transmitting claims between client and server.

**Q32: Where is the JWT stored in the browser client?**  
**A:** In the browser's `localStorage` under the key `'token'`, which is read by Axios to authenticate API requests.

**Q33: What is the expiration time of your JWT?**  
**A:** 24 hours (`1d`), configured during token generation via `{ expiresIn: '1d' }`.

**Q34: How does the server verify a JWT?**  
**A:** Using `jwt.verify(token, process.env.JWT_SECRET)`, which re-computes the HMAC-SHA256 signature and checks if the token has expired or been tampered with.

---

### G. Authentication & Authorization

**Q35: What is the difference between authentication and authorization?**  
**A:** Authentication verifies *who you are* (login credentials / JWT); authorization verifies *what you are allowed to do* (role permissions).

**Q36: How does the `protect` middleware authenticate users?**  
**A:** It reads the `Authorization` header, extracts the Bearer token, verifies it with `jwt.verify()`, queries MongoDB for the user, and attaches the user document to `req.user`.

**Q37: What HTTP status code is returned when a JWT is missing or invalid?**  
**A:** `401 Unauthorized`.

**Q38: How does the `authorizeRoles` middleware enforce permissions?**  
**A:** It checks whether `req.user.role` is included in the allowed roles parameter; if not, it returns `403 Forbidden`.

**Q39: Why does public registration force the `PATIENT` role?**  
**A:** To prevent privilege escalation attacks. Users cannot inject `{ role: 'ADMIN' }` into registration requests to grant themselves administrator privileges.

**Q40: How does the frontend handle token expiration?**  
**A:** An Axios response interceptor intercepts any HTTP `401` response, clears `localStorage`, and redirects the user to the `/login` page.

---

### H. Doctor Management

**Q41: Who is authorized to create a new doctor in CareClinic?**  
**A:** Only an authenticated user with the `ADMIN` role via the `POST /api/doctors` endpoint.

**Q42: What two database records are created when adding a doctor?**  
**A:** First, a `User` record with `role: 'DOCTOR'`, and second, a `Doctor` record whose `user` field references that newly created user ID.

**Q43: What happens if Doctor document creation fails after the User document is saved?**  
**A:** The controller has a rollback mechanism that immediately deletes the newly created User document to prevent orphaned user records.

**Q44: Can an admin delete a doctor who has existing appointments?**  
**A:** No. The controller checks `Appointment.findOne({ doctor: id })`. If appointments exist, it blocks deletion and returns HTTP `409 Conflict`.

**Q45: Can an unauthenticated user view doctor profiles?**  
**A:** Yes. `GET /api/doctors` and `GET /api/doctors/:id` are public endpoints so patients can research doctors before logging in.

**Q46: How does a doctor update their own consulting hours?**  
**A:** Through `PUT /api/doctors/me/availability` on the Doctor Dashboard, submitting an array of validated 24-hour time slots.

---

### I. Appointment Booking

**Q47: Who is authorized to book an appointment?**  
**A:** Only authenticated users with the `PATIENT` role via the `POST /api/appointments` endpoint.

**Q48: How does the backend know which patient is booking the appointment?**  
**A:** The patient ID is securely extracted from `req.user._id` (derived from the verified JWT), never from the request body.

**Q49: What is the initial status of a newly created appointment?**  
**A:** `PENDING`.

**Q50: Can a patient book an appointment in the past?**  
**A:** No. The controller compares the submitted date string against today's date (`todayStr`); past dates return HTTP `400 Bad Request`.

**Q51: How does a patient view their own appointments?**  
**A:** By calling `GET /api/appointments/my`, which queries `Appointment.find({ patient: req.user._id })`.

**Q52: Can a patient view appointments belonging to another patient?**  
**A:** No. Endpoints filter queries by `req.user._id`, and individual appointment lookup checks ownership, returning `403 Forbidden` if IDs do not match.

---

### J. Availability & Double-Booking Prevention

**Q53: How does the frontend know which slots are unbooked for a date?**  
**A:** It calls `GET /api/doctors/:id/available-slots?date=YYYY-MM-DD`, which dynamically filters out already-booked active slots.

**Q54: What happens if two patients attempt to book the exact same slot concurrently?**  
**A:** MongoDB's Compound Partial Unique Index triggers a duplicate key error (code `11000`). The controller catches this and returns HTTP `409 Conflict`.

**Q55: What fields are in the Compound Unique Index on the Appointment model?**  
**A:** `{ doctor: 1, date: 1, time: 1 }`.

**Q56: What is the `partialFilterExpression` on the unique index?**  
**A:** `{ status: { $in: ['PENDING', 'CONFIRMED'] } }`.

**Q57: Why is the partial filter necessary?**  
**A:** So that when an appointment is `CANCELLED`, it is dropped from the index constraint, allowing other patients to re-book that exact time slot.

**Q58: Does cancelling an appointment delete it from the database?**  
**A:** No. It updates `status = 'CANCELLED'`. This preserves medical audit history while instantly releasing the time slot.

---

### K. Testing & Debugging

**Q59: How did you test the backend API endpoints?**  
**A:** Using automated Node.js integration test scripts (`test-phase8.js`, `test-phase9.js`, `test-phase10.js`) that issue HTTP requests against the live Express server and MongoDB Atlas.

**Q60: What did `test-phase10.js` specifically verify?**  
**A:** Doctor availability updates, dynamic slot calculation, and double-booking rejection with HTTP `409 Conflict`.

**Q61: How did you test frontend React components and routes?**  
**A:** Using a Node.js SSR script (`test-react-routes.js`) utilizing React Router's `StaticRouter` to verify that all routes render without throwing exceptions.

**Q62: How do you handle database connection errors on server startup?**  
**A:** In [`backend/config/db.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/config/db.js), MongoDB connection errors are caught in a `try/catch` block that logs the error message and gracefully terminates the process via `process.exit(1)`.

---

### L. Git & Version Control

**Q63: Why do you have `.env` inside your `.gitignore` file?**  
**A:** To prevent sensitive production secrets, MongoDB database connection strings, and JWT signing keys from being exposed in public version control repositories.

**Q64: Why do you provide a `.env.example` file?**  
**A:** As a template documenting all required environment variable keys with safe placeholder values for new developers.

**Q65: What command do you use to check repository status and modified files?**  
**A:** `git status`.

**Q66: What is the purpose of Git branches?**  
**A:** To isolate new feature development or bug fixes from the stable `main` codebase until code has been reviewed and tested.

---

### M. Limitations & Future Scope

**Q67: What is the current payment handling in CareClinic?**  
**A:** Consultation fees are displayed in Sri Lankan Rupees (Rs.), but financial transactions are simulated; no live credit card or LankaQR payment gateway is currently integrated.

**Q68: How are appointment reminders delivered currently?**  
**A:** Reminders are managed in-app via the user dashboards; SMS (Twilio) and email (Nodemailer) dispatch are planned future enhancements.

**Q69: Can a patient book multiple time slots in a single submission?**  
**A:** No. Currently, the system supports single-slot bookings per submission to keep outpatient clinic scheduling simple and predictable.

**Q70: What would you implement in Phase 20?**  
**A:** Integrating an online payment gateway (e.g., PayHere), automated SMS/email reminders, electronic prescription uploads, and WebRTC video telemedicine consultations.

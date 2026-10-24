# Database Design and Schema Specification

## CareClinic – Clinical Appointment Booking System

This document outlines the database design, data modeling philosophy, Mongoose schemas, relationships, indexing strategies, and sample records for the **CareClinic Clinical Appointment Booking System**.

---

## Table of Contents

- [Database Management System & Philosophy](#database-management-system--philosophy)
- [Database Concepts](#database-concepts)
  - [MongoDB Collections](#mongodb-collections)
  - [BSON Documents](#bson-documents)
  - [ObjectId](#objectid)
  - [Mongoose Schemas & Models](#mongoose-schemas--models)
- [Entity-Relationship Architecture](#entity-relationship-architecture)
  - [Text-Based Database Relationship Diagram](#text-based-database-relationship-diagram)
  - [Relationship Explanations](#relationship-explanations)
  - [Mongoose Population (`populate`)](#mongoose-population-populate)
- [Schema Specifications](#schema-specifications)
  - [1. User Model (`User.js`)](#1-user-model-userjs)
  - [2. Doctor Model (`Doctor.js`)](#2-doctor-model-doctorjs)
  - [3. Appointment Model (`Appointment.js`)](#3-appointment-model-appointmentjs)
- [Indexing & Double-Booking Prevention](#indexing--double-booking-prevention)
  - [The Compound Partial Unique Index](#the-compound-partial-unique-index)
  - [Why a Partial Filter Expression is Critical](#why-a-partial-filter-expression-is-critical)
  - [Cancellation & Historical Audit Records](#cancellation--historical-audit-records)
- [Fictional Demonstration Records](#fictional-demonstration-records)
  - [Sample User Documents](#sample-user-documents)
  - [Sample Doctor Document](#sample-doctor-document)
  - [Sample Appointment Documents](#sample-appointment-documents)

---

## Database Management System & Philosophy

CareClinic uses **MongoDB Atlas**, a cloud-hosted NoSQL document database, interfaced via the **Mongoose ODM (Object Data Modeling)** library in Node.js.

### Why NoSQL for a Clinical Appointment System?
While relational databases (SQL) enforce strict rigid tabular structures, MongoDB provides:
1. **JSON-Native Structure:** Data is stored as BSON (Binary JSON), allowing seamless communication with the JavaScript/Node.js backend and React frontend without object-relational impedance mismatch.
2. **Flexible Document Structure:** Models can store array sub-structures (such as a doctor's `availableSlots: ["09:00", "09:30", "10:00"]`) naturally without requiring a separate join table.
3. **Normalized References Where Needed:** To avoid data duplication and inconsistencies, user credentials and doctor clinical profiles are separated and connected via referenced ObjectIds.

---

## Database Concepts

### MongoDB Collections
A **Collection** in MongoDB is analogous to a table in a relational database. It is a grouping of related documents. In CareClinic, MongoDB manages three collections:
- `users`: Stores authentication credentials, contact numbers, and system roles.
- `doctors`: Stores medical specializations, qualifications, experience, fees, and time slots.
- `appointments`: Stores scheduled consultations between patients and doctors.

### BSON Documents
A **Document** is a single record within a collection. Documents are stored internally as BSON (Binary JSON), supporting rich data types such as `Date`, `ObjectId`, arrays, and nested sub-documents.

### ObjectId
Every MongoDB document is automatically assigned a primary key field called `_id` of type `ObjectId`. An `ObjectId` is a 12-byte unique identifier composed of:
- **4-byte timestamp:** Represents the document's creation second (epoch time).
- **5-byte random value:** Generated per machine and process.
- **3-byte incrementing counter:** Initialized to a random value.

Because the first 4 bytes encode a timestamp, ObjectIds are naturally ordered chronologically and can be used to determine record creation time without dedicated timestamp fields.

### Mongoose Schemas & Models
- **Schema:** A Mongoose schema defines the structure of the document, default values, validators, getters, setters, and indexes at the application layer.
- **Model:** A compiled wrapper around the schema that provides an interface to query, create, update, and delete documents in the MongoDB collection (e.g., `User.find()`, `Appointment.create()`).

---

## Entity-Relationship Architecture

### Text-Based Database Relationship Diagram

```text
+-------------------------------------------------------------+
|                         users                               |
+-------------------------------------------------------------+
| _id          : ObjectId (PK)                                |
| name         : String                                       |
| email        : String (Unique, Lowercase)                   |
| password     : String (Hashed with bcrypt)                  |
| role         : String (Enum: 'PATIENT', 'DOCTOR', 'ADMIN')  |
| phone        : String                                       |
| createdAt    : Date (Timestamp)                             |
| updatedAt    : Date (Timestamp)                             |
+-------------------------------------------------------------+
       |                                              |
       | 1-to-1 Reference                             | 1-to-Many Reference
       | (Only when role = 'DOCTOR')                  | (Patient's Appointments)
       v                                              v
+-----------------------------+         +-----------------------------+
|          doctors            |         |        appointments         |
+-----------------------------+         +-----------------------------+
| _id            : ObjectId   |         | _id       : ObjectId (PK)   |
| user           : ObjectId---|----+    | patient   : ObjectId (FK)---+-> users._id
| specialization : String     |    |    | doctor    : ObjectId (FK)---+-> doctors._id
| qualification  : String     |    +--->| date      : String (YYYY-MM-DD)
| experience     : Number     |  1-to-M | time      : String (HH:MM)  |
| consultationFee: Number     |         | reason    : String          |
| availableSlots : [String]   |         | status    : String (Enum)   |
| profileImage   : String     |         | createdAt : Date            |
| createdAt      : Date       |         | updatedAt : Date            |
| updatedAt      : Date       |         +-----------------------------+
+-----------------------------+                        |
                                                       |
               ========================================+
               COMPOUND PARTIAL UNIQUE INDEX:
               Fields: { doctor: 1, date: 1, time: 1 }
               Condition: status IN ['PENDING', 'CONFIRMED']
```

### Relationship Explanations

1. **User to Doctor (1-to-1 Reference):**
   - A `User` record holds core login credentials (`email`, `password`) and contact info (`phone`).
   - If the user's role is `DOCTOR`, a corresponding `Doctor` document is created whose `user` field references the `User._id`.
   - The `user` field on the `Doctor` schema has `unique: true`, guaranteeing that a single User account cannot be linked to more than one Doctor profile.

2. **User (Patient) to Appointment (1-to-Many Reference):**
   - Each `Appointment` document stores `patient: ObjectId`, referencing the `users` collection.
   - One patient can book multiple appointments over time.

3. **Doctor to Appointment (1-to-Many Reference):**
   - Each `Appointment` document stores `doctor: ObjectId`, referencing the `doctors` collection.
   - One doctor can have multiple scheduled appointments across various dates and times.

### Mongoose Population (`populate`)

Because MongoDB is a non-relational database, it does not have SQL-style `JOIN` statements executed by the database engine. Instead, Mongoose provides the `.populate()` method, which automatically executes a secondary query to replace referenced ObjectIds with the actual documents from other collections.

In [`backend/controllers/appointmentController.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/controllers/appointmentController.js#L6-L17), CareClinic uses nested population helpers:

```javascript
// Helper to populate doctor details AND the doctor's linked user name/phone
const doctorPopulate = {
  path: 'doctor',
  populate: { path: 'user', select: 'name email phone -_id' },
  select: '-__v'
};

// Helper to populate patient user details
const patientPopulate = {
  path: 'patient',
  select: 'name email phone -_id'
};
```
When an appointment query runs `Appointment.findById(id).populate(doctorPopulate).populate(patientPopulate)`, Mongoose returns a unified JSON object containing the appointment, the doctor's qualifications, the doctor's display name, and the patient's contact information.

---

## Schema Specifications

### 1. User Model (`User.js`)

Defined in [`backend/models/User.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/models/User.js):

| Field | Data Type | Required | Unique | Validation / Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `name` | `String` | Yes | No | `trim: true` | Full name of the user (e.g., patient, doctor, or administrator). |
| `email` | `String` | Yes | Yes | `lowercase: true`, `trim: true` | Unique login email address. Indexed automatically by MongoDB. |
| `password` | `String` | Yes | No | `minlength: 6` | Salted and hashed password string (hashed using bcrypt with 10 rounds). |
| `role` | `String` | Yes | No | `enum: ['PATIENT', 'DOCTOR', 'ADMIN']`, `default: 'PATIENT'` | System access role determining permitted dashboard routes and API actions. |
| `phone` | `String` | No | No | `trim: true` | Contact phone number for appointment notifications. |
| `createdAt` | `Date` | Auto | No | Managed by `{ timestamps: true }` | Timestamp when the user registered. |
| `updatedAt` | `Date` | Auto | No | Managed by `{ timestamps: true }` | Timestamp when user details were last modified. |

### 2. Doctor Model (`Doctor.js`)

Defined in [`backend/models/Doctor.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/models/Doctor.js):

| Field | Data Type | Required | Unique | Validation / Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `user` | `ObjectId` | Yes | Yes | `ref: 'User'` | Reference linking this medical profile to a valid `User` account document. |
| `specialization`| `String` | Yes | No | `trim: true` | Medical specialty (e.g., General Medicine, Cardiology, Paediatrics). |
| `qualification` | `String` | Yes | No | `trim: true` | Academic and medical degrees (e.g., MBBS, MD, DCH, MS). |
| `experience` | `Number` | Yes | No | `min: 0` | Total years of clinical experience. |
| `consultationFee`| `Number` | Yes | No | `min: 0` | Consultation fee charged per appointment, denominated in Sri Lankan Rupees (Rs.). |
| `availableSlots`| `[String]` | No | No | `default: []` | Array of recurring available consultation start times in `HH:MM` 24-hour format. |
| `profileImage` | `String` | No | No | `default: ""` | URL or relative path to the doctor's portrait image. |
| `createdAt` | `Date` | Auto | No | Managed by `{ timestamps: true }` | Timestamp when the doctor profile was created. |
| `updatedAt` | `Date` | Auto | No | Managed by `{ timestamps: true }` | Timestamp when doctor details were last updated. |

### 3. Appointment Model (`Appointment.js`)

Defined in [`backend/models/Appointment.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/models/Appointment.js):

| Field | Data Type | Required | Unique | Validation / Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `patient` | `ObjectId` | Yes | No | `ref: 'User'` | Reference to the patient `User` document who booked the consultation. |
| `doctor` | `ObjectId` | Yes | No | `ref: 'Doctor'` | Reference to the `Doctor` document with whom the appointment is booked. |
| `date` | `String` | Yes | No | Format: `YYYY-MM-DD` | Calendar date of the consultation (stored as standard string to prevent UTC date shifting). |
| `time` | `String` | Yes | No | Format: `HH:MM` (24-hour) | Starting time of the appointment slot (e.g., `"09:30"`, `"14:00"`). |
| `reason` | `String` | Yes | No | `trim: true` | Patient's chief complaint, symptoms, or reason for booking. |
| `status` | `String` | Yes | No | `enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']`, `default: 'PENDING'` | Current lifecycle state of the consultation. |
| `createdAt` | `Date` | Auto | No | Managed by `{ timestamps: true }` | Timestamp when the booking was initiated. |
| `updatedAt` | `Date` | Auto | No | Managed by `{ timestamps: true }` | Timestamp when the appointment status was last altered. |

---

## Indexing & Double-Booking Prevention

### The Compound Partial Unique Index

A critical requirement of any clinical booking system is guaranteeing that two patients cannot book the same doctor at the same date and time. CareClinic enforces this using a **MongoDB Compound Partial Unique Index** declared directly in [`Appointment.js`](file:///c:/Users/ASUS/Desktop/ClinicalAppointmentSystem/backend/models/Appointment.js#L38-L44):

```javascript
appointmentSchema.index(
  { doctor: 1, date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['PENDING', 'CONFIRMED'] } },
  }
);
```

### Why a Partial Filter Expression is Critical

Consider what happens with a simple unique index on `{ doctor: 1, date: 1, time: 1 }` without a partial filter:
1. Patient A books Dr. Kavindu on `2026-11-15` at `10:00`. (Record created: Status = `PENDING`).
2. Patient A cancels their appointment. (Record updated: Status = `CANCELLED`).
3. Patient B attempts to book Dr. Kavindu on `2026-11-15` at `10:00`.
4. *Problem:* A simple unique index would **reject** Patient B's booking because a document with `{ doctor, date: '2026-11-15', time: '10:00' }` already exists in the collection!

By configuring `partialFilterExpression: { status: { $in: ['PENDING', 'CONFIRMED'] } }`:
- The index only indexes documents where the status is currently active (`PENDING` or `CONFIRMED`).
- When an appointment is `CANCELLED` (or `COMPLETED`), MongoDB drops it from the unique index constraint.
- As a result, Patient B can immediately book that same slot on `2026-11-15` at `10:00` without any database conflict!

### Cancellation & Historical Audit Records

In CareClinic, cancellations do not delete documents (`db.appointments.deleteOne()` is never called during cancellation). 

Instead, the appointment status is updated to `CANCELLED`. This provides two major clinical advantages:
1. **Audit Trail:** The clinic retains a complete medical log of all historical bookings, cancellations, and completed visits for reporting and auditing.
2. **Instant Slot Reclamation:** Updating the status to `CANCELLED` automatically releases the slot constraint in the partial index and removes the time from `bookedTimes` queries, restoring the slot to the public booking view.

---

## Fictional Demonstration Records

The following sample JSON objects illustrate the document structures stored in MongoDB Atlas:

### Sample User Documents

#### 1. Fictional Patient Record
```json
{
  "_id": { "$oid": "6ac70a1d582c8fc194fad101" },
  "name": "Kamal Wickramasinghe",
  "email": "kamal.patient@example.lk",
  "password": "[hashed_password_placeholder]",
  "role": "PATIENT",
  "phone": "0772345678",
  "createdAt": "2026-10-22T08:30:00.000Z",
  "updatedAt": "2026-10-22T08:30:00.000Z"
}
```

#### 2. Fictional Doctor User Record
```json
{
  "_id": { "$oid": "6ac70a1d582c8fc194fad202" },
  "name": "Dr. Kavindu Silva",
  "email": "kavindu.doctor@careclinic.lk",
  "password": "[hashed_password_placeholder]",
  "role": "DOCTOR",
  "phone": "0714567890",
  "createdAt": "2026-10-22T08:35:00.000Z",
  "updatedAt": "2026-10-22T08:35:00.000Z"
}
```

### Sample Doctor Document

Linked to Dr. Kavindu Silva's User account (`6ac70a1d582c8fc194fad202`):

```json
{
  "_id": { "$oid": "6ac70ab6582c8fc194fad35c" },
  "user": { "$oid": "6ac70a1d582c8fc194fad202" },
  "specialization": "Cardiology",
  "qualification": "MBBS, MD (Cardiology)",
  "experience": 8,
  "consultationFee": 5000,
  "availableSlots": [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "14:00",
    "14:30"
  ],
  "profileImage": "https://images.unsplash.com/photo-1589451027161-e0c68c0a5c33?fit=crop&w=150&h=150",
  "createdAt": "2026-10-22T08:40:00.000Z",
  "updatedAt": "2026-10-22T08:40:00.000Z"
}
```

### Sample Appointment Documents

#### 1. Active Confirmed Appointment
```json
{
  "_id": { "$oid": "6ac80a1d582c8fc194fad401" },
  "patient": { "$oid": "6ac70a1d582c8fc194fad101" },
  "doctor": { "$oid": "6ac70ab6582c8fc194fad35c" },
  "date": "2026-11-10",
  "time": "09:30",
  "reason": "Routine cardiac checkup and blood pressure monitoring",
  "status": "CONFIRMED",
  "createdAt": "2026-10-23T09:15:00.000Z",
  "updatedAt": "2026-10-23T10:00:00.000Z"
}
```

#### 2. Cancelled Appointment (Slot Released)
```json
{
  "_id": { "$oid": "6ac80a1d582c8fc194fad402" },
  "patient": { "$oid": "6ac70a1d582c8fc194fad101" },
  "doctor": { "$oid": "6ac70ab6582c8fc194fad35c" },
  "date": "2026-11-10",
  "time": "14:00",
  "reason": "Consultation for chest tightness - patient rescheduled",
  "status": "CANCELLED",
  "createdAt": "2026-10-23T11:20:00.000Z",
  "updatedAt": "2026-10-23T14:45:00.000Z"
}
```
*Note: Because this record has `status: 'CANCELLED'`, MongoDB's partial unique index ignores it, allowing another patient to book Dr. Kavindu on `2026-11-10` at `14:00` without throwing a duplicate key error.*

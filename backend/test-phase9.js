require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Appointment = require('./models/Appointment');
const Doctor = require('./models/Doctor');
const User = require('./models/User');

const API_URL = 'http://localhost:5000/api';
const adminCreds = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
const patientCreds = { email: 'patient8@example.com', password: 'test123password' };
const doctorCreds = { email: 'testdoctor1@example.com', password: 'doctor123password' };

let summary = {
  mongo: 'FAIL',
  server: 'FAIL',
  model: 'FAIL',
  patientBooking: 'FAIL',
  patientAssignment: 'FAIL',
  fakePatient: 'FAIL',
  invalidDoctor: 'FAIL',
  myAppointments: 'FAIL',
  patientOwnership: 'FAIL',
  doctorList: 'FAIL',
  doctorOwnership: 'FAIL',
  doctorStatusUpdate: 'FAIL',
  invalidStatus: 'FAIL',
  adminAll: 'FAIL',
  adminProtect: 'FAIL',
  patientCancel: 'FAIL',
  completedCancel: 'FAIL',
  passwordProtect: 'FAIL',
  regression: 'FAIL',
  envProtect: 'FAIL'
};

async function runTests() {
  console.log('--- STARTING PHASE 9 TESTS ---');
  try {
    // 0. Connect DB
    await mongoose.connect(process.env.MONGO_URI);
    summary.mongo = 'PASS';
    // Clean appointments collection
    await Appointment.deleteMany();
    // 1. Admin login
    let res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adminCreds) });
    let data = await res.json();
    const adminToken = data.token;
    if (res.status === 200 && adminToken) console.log('PASS: Admin login'); else { console.log('FAIL: Admin login'); }
    // 2. Patient login
    res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patientCreds) });
    data = await res.json();
    const patientToken = data.token;
    const patientId = jwt.verify(patientToken, process.env.JWT_SECRET).userId;
    if (res.status === 200 && patientToken) { console.log('PASS: Patient login'); summary.patientBooking = 'PASS'; } else { console.log('FAIL: Patient login'); }
    // 3. Doctor login
    res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(doctorCreds) });
    data = await res.json();
    const doctorToken = data.token;
    const doctorUserId = jwt.verify(doctorToken, process.env.JWT_SECRET).userId;
    // 4. Get Doctor document ID via API
    res = await fetch(`${API_URL}/doctors`);
    data = await res.json();
    const doctorDoc = data.find(d => d.user && d.user.email === doctorCreds.email);
    const doctorId = doctorDoc ? doctorDoc._id : null;
    if (!doctorId) { console.log('FAIL: Could not fetch doctor ID'); }
    // 5. PATIENT BOOKING
    const appointmentPayload = { doctor: doctorId, date: '2026-10-15', time: '09:00', reason: 'General consultation' };
    res = await fetch(`${API_URL}/appointments`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` }, body: JSON.stringify(appointmentPayload) });
    data = await res.json();
    if (res.status === 201 && data.appointment) {
      console.log('PASS: Patient booking created');
      summary.patientBooking = 'PASS';
    } else { console.log('FAIL: Patient booking', res.status, data); }
    const appointmentId = data.appointment ? data.appointment._id : null;
    // Verify patient assignment and status
    if (appointmentId) {
      const stored = await Appointment.findById(appointmentId).lean();
      if (stored && stored.patient.toString() === patientId && stored.status === 'PENDING' && stored.createdAt) {
        console.log('PASS: Patient assignment and status');
        summary.patientAssignment = 'PASS';
      } else { console.log('FAIL: Patient assignment check'); }
    }
    // 6. FAKE PATIENT ID protection
    const fakePayload = { doctor: doctorId, date: '2026-10-16', time: '10:00', reason: 'Check', patient: mongoose.Types.ObjectId() };
    res = await fetch(`${API_URL}/appointments`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` }, body: JSON.stringify(fakePayload) });
    data = await res.json();
    const fakeAppId = data.appointment ? data.appointment._id : null;
    if (fakeAppId) {
      const fakeApp = await Appointment.findById(fakeAppId).lean();
      if (fakeApp && fakeApp.patient.toString() === patientId) {
        console.log('PASS: Fake patient ID ignored');
        summary.fakePatient = 'PASS';
      } else { console.log('FAIL: Fake patient ID not ignored'); }
    } else { console.log('FAIL: Fake patient booking failed'); }
    // 7. INVALID DOCTOR handling
    const nonexistentId = new mongoose.Types.ObjectId().toString();
    res = await fetch(`${API_URL}/appointments`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` }, body: JSON.stringify({ doctor: nonexistentId, date: '2026-10-17', time: '11:00', reason: 'X' }) });
    if (res.status === 404) { console.log('PASS: Invalid doctor 404'); summary.invalidDoctor = 'PASS'; } else { console.log('FAIL: Invalid doctor status', res.status); }
    // malformed ID
    res = await fetch(`${API_URL}/appointments`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` }, body: JSON.stringify({ doctor: 'invalid_id', date: '2026-10-18', time: '12:00', reason: 'Y' }) });
    if (res.status >= 400 && res.status < 500) { console.log('PASS: Malformed doctor ID handled'); } else { console.log('FAIL: Malformed doctor ID', res.status); }
    // 8. MY APPOINTMENTS
    res = await fetch(`${API_URL}/appointments/my`, { headers: { Authorization: `Bearer ${patientToken}` } });
    data = await res.json();
    if (Array.isArray(data) && data.every(a => a.patient && a.patient.toString() === patientId)) {
      console.log('PASS: My appointments filtered'); summary.myAppointments = 'PASS';
    } else { console.log('FAIL: My appointments'); }
    // 9. PATIENT GET ONE (owner)
    res = await fetch(`${API_URL}/appointments/${appointmentId}`, { headers: { Authorization: `Bearer ${patientToken}` } });
    if (res.status === 200) { console.log('PASS: Patient can view own'); summary.patientOwnership = 'PASS'; } else { console.log('FAIL: Patient view own', res.status); }
    // another patient
    const otherPatientCreds = { email: 'patient9@example.com', password: 'test9pass' };
    // register other patient
    await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Patient9', email: otherPatientCreds.email, password: otherPatientCreds.password }) });
    res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(otherPatientCreds) });
    const otherPatientToken = (await res.json()).token;
    res = await fetch(`${API_URL}/appointments/${appointmentId}`, { headers: { Authorization: `Bearer ${otherPatientToken}` } });
    if (res.status === 403) { console.log('PASS: Other patient blocked'); } else { console.log('FAIL: Other patient access', res.status); }
    // 10. DOCTOR LIST APPOINTMENTS
    res = await fetch(`${API_URL}/appointments/doctor`, { headers: { Authorization: `Bearer ${doctorToken}` } });
    data = await res.json();
    if (Array.isArray(data) && data.some(a => a.doctor && a.doctor._id === doctorId)) { console.log('PASS: Doctor list'); summary.doctorList = 'PASS'; } else { console.log('FAIL: Doctor list'); }
    // 11. DOCTOR GET ONE (owner)
    res = await fetch(`${API_URL}/appointments/${appointmentId}`, { headers: { Authorization: `Bearer ${doctorToken}` } });
    if (res.status === 200) { console.log('PASS: Doctor can view own'); summary.doctorOwnership = 'PASS'; } else { console.log('FAIL: Doctor view own', res.status); }
    // another doctor - create second doctor via admin
    const newDoctorPayload = { name: 'Dr Clone', email: 'clone@example.com', password: 'clonepass', phone: '0770000000', specialization: 'General', qualification: 'MBBS', experience: 1, consultationFee: 100, availableSlots: ['09:00'] };
    res = await fetch(`${API_URL}/doctors`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }, body: JSON.stringify(newDoctorPayload) });
    const cloneDoctor = (await res.json()).doctor;
    // login as clone doctor
    const cloneCreds = { email: newDoctorPayload.email, password: newDoctorPayload.password };
    res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cloneCreds) });
    const cloneToken = (await res.json()).token;
    // attempt update by wrong doctor
    res = await fetch(`${API_URL}/appointments/${appointmentId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cloneToken}` }, body: JSON.stringify({ status: 'CONFIRMED' }) });
    if (res.status === 403) { console.log('PASS: Wrong doctor cannot update'); } else { console.log('FAIL: Wrong doctor update', res.status); }
    // 12. Doctor confirms appointment
    res = await fetch(`${API_URL}/appointments/${appointmentId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` }, body: JSON.stringify({ status: 'CONFIRMED' }) });
    const confData = await res.json();
    if (res.status === 200 && confData.appointment && confData.appointment.status === 'CONFIRMED') { console.log('PASS: Doctor confirmed'); summary.doctorStatusUpdate = 'PASS'; } else { console.log('FAIL: Doctor confirm', res.status, confData); }
    // 13. Invalid status by doctor
    res = await fetch(`${API_URL}/appointments/${appointmentId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` }, body: JSON.stringify({ status: 'CANCELLED' }) });
    if (res.status === 400) { console.log('PASS: Invalid status rejected'); summary.invalidStatus = 'PASS'; } else { console.log('FAIL: Invalid status', res.status); }
    // 14. ADMIN all appointments
    res = await fetch(`${API_URL}/appointments/all`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const allData = await res.json();
    if (Array.isArray(allData) && allData.length > 0) { console.log('PASS: Admin all'); summary.adminAll = 'PASS'; } else { console.log('FAIL: Admin all'); }
    // patient trying admin route
    res = await fetch(`${API_URL}/appointments/all`, { headers: { Authorization: `Bearer ${patientToken}` } });
    if (res.status === 403) { console.log('PASS: Patient blocked from admin route'); summary.adminProtect = 'PASS'; } else { console.log('FAIL: Patient admin route', res.status); }
    // 15. Patient cancellation
    const tempPayload = { doctor: doctorId, date: '2026-10-20', time: '14:00', reason: 'Temp' };
    res = await fetch(`${API_URL}/appointments`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` }, body: JSON.stringify(tempPayload) });
    const tempApp = (await res.json()).appointment;
    const tempId = tempApp._id;
    res = await fetch(`${API_URL}/appointments/${tempId}/cancel`, { method: 'PUT', headers: { Authorization: `Bearer ${patientToken}` } });
    const cancelData = await res.json();
    const afterCancel = await Appointment.findById(tempId).lean();
    if (res.status === 200 && afterCancel && afterCancel.status === 'CANCELLED') { console.log('PASS: Patient cancellation'); summary.patientCancel = 'PASS'; } else { console.log('FAIL: Patient cancellation', res.status); }
    // 16. Completed cancellation restriction
    await fetch(`${API_URL}/appointments/${appointmentId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` }, body: JSON.stringify({ status: 'COMPLETED' }) });
    res = await fetch(`${API_URL}/appointments/${appointmentId}/cancel`, { method: 'PUT', headers: { Authorization: `Bearer ${patientToken}` } });
    if (res.status === 400) { console.log('PASS: Completed cancellation blocked'); summary.completedCancel = 'PASS'; } else { console.log('FAIL: Completed cancellation', res.status); }
    // 17. Password protection check
    const anyResp = await fetch(`${API_URL}/appointments/all`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const anyData = await anyResp.json();
    const passwordLeak = anyData.some(a => (a.patient && a.patient.password) || (a.doctor && a.doctor.user && a.doctor.user.password));
    if (!passwordLeak) { console.log('PASS: No passwords exposed'); summary.passwordProtect = 'PASS'; } else { console.log('FAIL: Password leak'); }
    // 18. Regression tests
    res = await fetch(`${API_URL.replace('/api','/')}`);
    const rootOk = res.status === 200;
    const regPayload = { name: 'Reg Test', email: 'regtest@example.com', password: 'regpass' };
    res = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(regPayload) });
    const regOk = res.status === 201;
    res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: regPayload.email, password: regPayload.password }) });
    const loginOk = res.status === 200;
    res = await fetch(`${API_URL}/doctors`);
    const docListOk = res.status === 200;
    if (rootOk && regOk && loginOk && docListOk) { console.log('PASS: Regression'); summary.regression = 'PASS'; } else { console.log('FAIL: Regression'); }
    const gitIgnore = require('fs').readFileSync('C:/Users/ASUS/Desktop/Folders/ClinicalAppointmentSystem/.gitignore','utf8');
    if (gitIgnore.includes('.env')) { console.log('PASS: .env ignored'); summary.envProtect = 'PASS'; } else { console.log('FAIL: .env not ignored'); }
  } catch (err) {
    console.error('ERROR during tests', err);
  } finally {
    await mongoose.disconnect();
    console.log('--- SUMMARY ---');
    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
  }
}

runTests();

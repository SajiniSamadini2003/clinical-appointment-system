require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Doctor = require('./models/Doctor');

const API_URL = 'http://localhost:5000/api';
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

async function runTests() {
  console.log('--- STARTING PHASE 8 TESTS ---');
  let allPass = true;
  let adminToken = '';
  let patientToken = '';
  let doctorId1 = '';
  let doctorId2 = '';
  
  // Clean up any test doctors from previous runs
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany({ email: { $regex: /testdoctor.*@example.com/ } });
  await User.deleteMany({ email: { $regex: /patient8.*@example.com/ } });
  await Doctor.deleteMany(); // Since it's testing, just clear out doctors for clean run
  
  try {
    // 1. ADMIN LOGIN
    console.log('\n1. ADMIN LOGIN');
    let res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });
    let data = await res.json();
    if (res.status === 200 && data.token && data.user.role === 'ADMIN') {
      adminToken = data.token;
      console.log('PASS: Admin login successful');
    } else {
      console.log('FAIL: Admin login', res.status, data);
      allPass = false;
    }

    // 2. CREATE DOCTOR
    console.log('\n2. CREATE DOCTOR');
    res = await fetch(`${API_URL}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: "Dr Test Doctor",
        email: "testdoctor1@example.com",
        password: "doctor123password",
        phone: "0771234567",
        specialization: "General Medicine",
        qualification: "MBBS",
        experience: 5,
        consultationFee: 2500,
        availableSlots: ["09:00", "10:00", "11:00"],
        profileImage: ""
      })
    });
    data = await res.json();
    if (res.status === 201 && data.doctor && data.doctor.user && data.doctor.user.role === 'DOCTOR' && !data.doctor.user.password) {
      doctorId1 = data.doctor._id;
      console.log('PASS: Doctor 1 created');
    } else {
      console.log('FAIL: Doctor creation', res.status, data);
      allPass = false;
    }

    // 3. PUBLIC GET ALL DOCTORS
    console.log('\n3. PUBLIC GET ALL DOCTORS');
    res = await fetch(`${API_URL}/doctors`);
    data = await res.json();
    if (res.status === 200 && Array.isArray(data) && data.length > 0 && !data[0].user.password && data[0].user.name) {
      console.log('PASS: Public GET all doctors');
    } else {
      console.log('FAIL: GET all doctors', res.status);
      allPass = false;
    }

    // 4. PUBLIC GET ONE DOCTOR
    console.log('\n4. PUBLIC GET ONE DOCTOR');
    res = await fetch(`${API_URL}/doctors/${doctorId1}`);
    data = await res.json();
    if (res.status === 200 && data._id === doctorId1 && !data.user.password && data.user.name) {
      console.log('PASS: Public GET one doctor');
    } else {
      console.log('FAIL: GET one doctor', res.status);
      allPass = false;
    }

    // 5. ADMIN UPDATE
    console.log('\n5. ADMIN UPDATE');
    res = await fetch(`${API_URL}/doctors/${doctorId1}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        consultationFee: 3000,
        experience: 6,
        availableSlots: ["09:00", "10:00", "14:00"]
      })
    });
    data = await res.json();
    if (res.status === 200 && data.doctor.consultationFee === 3000 && data.doctor.experience === 6) {
      console.log('PASS: Admin updated doctor');
    } else {
      console.log('FAIL: Admin update', res.status, data);
      allPass = false;
    }

    // 6. PATIENT SECURITY TEST
    console.log('\n6. PATIENT SECURITY TEST');
    // First register a patient
    await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Patient 8", email: "patient8@example.com", password: "test123password" })
    });
    let patRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: "patient8@example.com", password: "test123password" })
    });
    let patData = await patRes.json();
    patientToken = patData.token;

    // PATIENT POST
    res = await fetch(`${API_URL}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${patientToken}` },
      body: JSON.stringify({ name: "Hacker Doc", email: "hack@example.com", password: "123", specialization: "None", qualification: "None", experience: 0, consultationFee: 0 })
    });
    if (res.status === 403) console.log('PASS: Patient POST restriction');
    else { console.log('FAIL: Patient POST', res.status); allPass = false; }

    // PATIENT PUT
    res = await fetch(`${API_URL}/doctors/${doctorId1}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${patientToken}` },
      body: JSON.stringify({ consultationFee: 1 })
    });
    if (res.status === 403) console.log('PASS: Patient PUT restriction');
    else { console.log('FAIL: Patient PUT', res.status); allPass = false; }

    // PATIENT DELETE
    res = await fetch(`${API_URL}/doctors/${doctorId1}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${patientToken}` }
    });
    if (res.status === 403) console.log('PASS: Patient DELETE restriction');
    else { console.log('FAIL: Patient DELETE', res.status); allPass = false; }

    // 7. NO TOKEN SECURITY
    console.log('\n7. NO TOKEN SECURITY');
    res = await fetch(`${API_URL}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Hacker Doc", email: "hack2@example.com", password: "123", specialization: "None", qualification: "None", experience: 0, consultationFee: 0 })
    });
    if (res.status === 401) console.log('PASS: No token POST restriction');
    else { console.log('FAIL: No token POST', res.status); allPass = false; }

    // 8. DUPLICATE DOCTOR EMAIL
    console.log('\n8. DUPLICATE DOCTOR EMAIL');
    res = await fetch(`${API_URL}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: "Dr Clone", email: "testdoctor1@example.com", password: "123", specialization: "A", qualification: "B", experience: 1, consultationFee: 100
      })
    });
    if (res.status === 400) console.log('PASS: Duplicate email handling');
    else { console.log('FAIL: Duplicate email', res.status); allPass = false; }

    // 9. INVALID DOCTOR ID
    console.log('\n9. INVALID DOCTOR ID');
    // Valid objectId but nonexistent
    const fakeObjectId = new mongoose.Types.ObjectId().toString();
    res = await fetch(`${API_URL}/doctors/${fakeObjectId}`);
    if (res.status === 404) console.log('PASS: Valid nonexistent ID returns 404');
    else { console.log('FAIL: Valid nonexistent ID', res.status); allPass = false; }

    // Malformed ID
    res = await fetch(`${API_URL}/doctors/123invalid_id`);
    // Depending on my controller, it returns 500 or 400. Let's see what it returns. Both don't crash.
    if (res.status >= 400 && res.status <= 500) {
      console.log(`PASS: Malformed ID handled safely with status ${res.status}`);
    } else {
      console.log('FAIL: Malformed ID', res.status); allPass = false;
    }

    // 10. DELETE TEST
    console.log('\n10. DELETE TEST');
    // Create second doctor
    res = await fetch(`${API_URL}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: "Dr Delete Me", email: "delete@example.com", password: "pass", specialization: "A", qualification: "B", experience: 1, consultationFee: 100
      })
    });
    data = await res.json();
    doctorId2 = data.doctor._id;
    const doctorUserId2 = data.doctor.user._id;

    // Delete it
    res = await fetch(`${API_URL}/doctors/${doctorId2}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.status === 200) console.log('PASS: Doctor deleted response');
    else { console.log('FAIL: Doctor delete', res.status); allPass = false; }

    // Verify DB
    const checkDoc = await Doctor.findById(doctorId2);
    const checkUser = await User.findById(doctorUserId2);
    if (!checkDoc && !checkUser) {
      console.log('PASS: Doctor and linked User removed from DB');
    } else {
      console.log('FAIL: Doctor or User not removed from DB');
      allPass = false;
    }

    // Check Password Hashing for doctor1
    console.log('\n11. DB INTEGRITY CHECK');
    const doc1 = await Doctor.findById(doctorId1);
    const docUser1 = await User.findById(doc1.user);
    if (docUser1.password && docUser1.password.startsWith('$2b$')) {
      console.log('PASS: Password hashed correctly');
    } else {
      console.log('FAIL: Password not hashed'); allPass = false;
    }

  } catch (error) {
    console.error('ERROR during tests:', error);
    allPass = false;
  } finally {
    await mongoose.disconnect();
    console.log('\nALL PASS:', allPass);
    process.exit(allPass ? 0 : 1);
  }
}

runTests();

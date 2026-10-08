require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const mongoose = require('mongoose');
const Appointment = require('./models/Appointment');

const API_URL = 'http://localhost:5000/api';
const adminCreds = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
const doctorCreds = { email: 'testdoctor1@example.com', password: 'doctor123password' };
const patientCreds = { email: 'patient8@example.com', password: 'test123password' };

function futureDate(days = 1) { const d = new Date(); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); }

async function runTests(){
  console.log('--- STARTING PHASE 10 TESTS ---');
  const summary = {};
  try {
    await mongoose.connect(process.env.MONGO_URI);
    summary.mongo='PASS';
    const testDate = futureDate();
    await Appointment.deleteMany({date:{$in:[testDate,futureDate(2)]}});
    // login doctor
    let res = await fetch(`${API_URL}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(doctorCreds)});
    let data = await res.json();
    const doctorToken=data.token; summary.doctorLogin=res.status===200&&doctorToken?'PASS':'FAIL';
    // login patient
    res = await fetch(`${API_URL}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(patientCreds)});
    data = await res.json();
    const patientToken=data.token; summary.patientLogin=res.status===200&&patientToken?'PASS':'FAIL';
    // 1 set availability
    res = await fetch(`${API_URL}/doctors/me/availability`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${doctorToken}`},body:JSON.stringify({availableSlots:['09:00','10:00','11:00','14:00']})});
    summary.doctorSetAvail=res.status===200?'PASS':'FAIL';
    // 2 invalid availability
    res = await fetch(`${API_URL}/doctors/me/availability`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${doctorToken}`},body:JSON.stringify({availableSlots:['09:00','invalid-time']})});
    summary.invalidAvail=res.status===400?'PASS':'FAIL';
    // 3 patient cannot change
    res = await fetch(`${API_URL}/doctors/me/availability`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${patientToken}`},body:JSON.stringify({availableSlots:['09:00']})});
    summary.patientCannotChange=res.status===403?'PASS':'FAIL';
    // get doctor id
    res = await fetch(`${API_URL}/doctors`);
    const doctors = await res.json();
    const doctor = doctors.find(d=>d.user && d.user.email===doctorCreds.email);
    const doctorId = doctor?doctor._id:null;
    const future = futureDate();
    // 4 initial slots
    res = await fetch(`${API_URL}/doctors/${doctorId}/available-slots?date=${future}`);
    const initSlots = (await res.json()).availableSlots;
    const expected=['09:00','10:00','11:00','14:00'];
    summary.initialSlots = expected.every(s=>initSlots.includes(s))?'PASS':'FAIL';
    // 5 book 09:00
    res = await fetch(`${API_URL}/appointments`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${patientToken}`},body:JSON.stringify({doctor:doctorId,date:future,time:'09:00',reason:'Phase 10 test'})});
    const book1 = (await res.json()).appointment; summary.bookValid = (res.status===201 && book1 && book1.status==='PENDING')?'PASS':'FAIL';
    // 6 slots after booking
    res = await fetch(`${API_URL}/doctors/${doctorId}/available-slots?date=${future}`);
    const afterSlots = (await res.json()).availableSlots; summary.slotRemoved = !afterSlots.includes('09:00')?'PASS':'FAIL';
    // 7 double booking
    res = await fetch(`${API_URL}/appointments`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${patientToken}`},body:JSON.stringify({doctor:doctorId,date:future,time:'09:00',reason:'double'})});
    summary.doubleBooking = res.status===409?'PASS':'FAIL';
    // 8 different time 10:00
    res = await fetch(`${API_URL}/appointments`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${patientToken}`},body:JSON.stringify({doctor:doctorId,date:future,time:'10:00',reason:'diff time'})});
    const book2 = (await res.json()).appointment; summary.diffTime = (res.status===201 && book2)?'PASS':'FAIL';
    // 9 different date 09:00 next day
    const nextDay = futureDate(2);
    res = await fetch(`${API_URL}/appointments`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${patientToken}`},body:JSON.stringify({doctor:doctorId,date:nextDay,time:'09:00',reason:'diff date'})});
    const book3 = (await res.json()).appointment; summary.diffDate = (res.status===201 && book3)?'PASS':'FAIL';
    // 10 unconfigured time 12:00
    res = await fetch(`${API_URL}/appointments`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${patientToken}`},body:JSON.stringify({doctor:doctorId,date:future,time:'12:00',reason:'bad time'})});
    summary.unconfiguredTime = res.status===400?'PASS':'FAIL';
    // 11 cancel 09:00
    if (book1 && book1._id){
      res = await fetch(`${API_URL}/appointments/${book1._id}/cancel`,{method:'PUT',headers:{Authorization:`Bearer ${patientToken}`}});
      summary.cancellation=res.status===200?'PASS':'FAIL';
    } else summary.cancellation='FAIL';
    // check slot released
    res = await fetch(`${API_URL}/doctors/${doctorId}/available-slots?date=${future}`);
    const afterCancel = (await res.json()).availableSlots; summary.slotReleased = afterCancel.includes('09:00')?'PASS':'FAIL';
    // rebook cancelled slot
    res = await fetch(`${API_URL}/appointments`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${patientToken}`},body:JSON.stringify({doctor:doctorId,date:future,time:'09:00',reason:'rebook'})});
    summary.rebookAfterCancel = res.status===201?'PASS':'FAIL';
    // confirm appointment (book2)
    const docLogin = await fetch(`${API_URL}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(doctorCreds)});
    const doctorTok = (await docLogin.json()).token;
    if (doctorTok && book2 && book2._id){
      res = await fetch(`${API_URL}/appointments/${book2._id}/status`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${doctorTok}`},body:JSON.stringify({status:'CONFIRMED'})});
      summary.confirmed=res.status===200?'PASS':'FAIL';
    } else summary.confirmed='FAIL';
    // attempt booking same confirmed slot
    res = await fetch(`${API_URL}/appointments`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${patientToken}`},body:JSON.stringify({doctor:doctorId,date:future,time:'10:00',reason:'conflict'})});
    summary.confirmedSlotBlock = res.status===409?'PASS':'FAIL';
    // 13 past date
    res = await fetch(`${API_URL}/appointments`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${patientToken}`},body:JSON.stringify({doctor:doctorId,date:'2025-01-01',time:'09:00',reason:'past'})});
    summary.pastDate = res.status===400?'PASS':'FAIL';
    // 14 invalid date
    res = await fetch(`${API_URL}/appointments`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${patientToken}`},body:JSON.stringify({doctor:doctorId,date:'2026-13-01',time:'09:00',reason:'bad'})});
    summary.invalidDate = res.status===400?'PASS':'FAIL';
    // 15 db uniqueness already checked
    summary.dbUniqueness = summary.doubleBooking==='PASS'?'PASS':'FAIL';
    // 16 regression: root
    res = await fetch('http://localhost:5000/');
    summary.root = res.status===200?'PASS':'FAIL';
    // admin doctor create
    const adminLogin = await fetch(`${API_URL}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(adminCreds)});
    const adminToken = (await adminLogin.json()).token;
    const newDoc={name:'Dr Test',email:'drtest@example.com',password:'drtestpass',phone:'0771111111',specialization:'Test',qualification:'MBBS',experience:1,consultationFee:100,availableSlots:['09:00']};
    res = await fetch(`${API_URL}/doctors`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${adminToken}`},body:JSON.stringify(newDoc)});
    summary.adminCreateDoctor = res.status===201?'PASS':'FAIL';
    // patient list
    res = await fetch(`${API_URL}/appointments/my`,{headers:{Authorization:`Bearer ${patientToken}`}});
    summary.patientList = res.status===200?'PASS':'FAIL';
    // doctor list
    res = await fetch(`${API_URL}/appointments/doctor`,{headers:{Authorization:`Bearer ${doctorTok}`}});
    summary.doctorList = res.status===200?'PASS':'FAIL';
    // admin all
    res = await fetch(`${API_URL}/appointments/all`,{headers:{Authorization:`Bearer ${adminToken}`}});
    summary.adminAll = res.status===200?'PASS':'FAIL';
  } catch(e){ console.error('Error',e); }
  finally{ await mongoose.disconnect(); console.log('--- SUMMARY ---'); console.log(JSON.stringify(summary,null,2)); process.exit(0); }
}
runTests();

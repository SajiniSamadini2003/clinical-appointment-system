require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      console.log('ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be defined in .env');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({ email: email.toLowerCase() });
    
    if (existingAdmin) {
      console.log('An admin with this email already exists.');
    } else {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const adminUser = new User({
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN'
      });

      await adminUser.save();
      console.log('Admin user created successfully.');
    }

  } catch (error) {
    console.error('Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();

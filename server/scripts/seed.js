const path = require('path');
const dotenv = require('dotenv');

// Ensure environment variables are loaded from the server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');

const seedUsers = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/acxiom_crm';

  console.log(`Connecting to database at ${uri}...`);
  await mongoose.connect(uri);

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@Acxiom2026!';
  const managerPassword = process.env.SEED_MANAGER_PASSWORD || 'Manager@Acxiom2026!';
  const execPassword = process.env.SEED_EXEC_PASSWORD || 'Sales@Acxiom2026!';

  // 1. Seed or update Admin
  let admin = await User.findOne({ email: process.env.SEED_ADMIN_EMAIL || 'rajesh.sharma@acxiomcrm.internal' });
  if (!admin) {
    admin = new User({
      name: process.env.SEED_ADMIN_NAME || 'Rajesh Sharma',
      email: (process.env.SEED_ADMIN_EMAIL || 'rajesh.sharma@acxiomcrm.internal').toLowerCase(),
      phone: process.env.SEED_ADMIN_PHONE || '9820123456',
      password: adminPassword,
      role: 'Admin',
      isActive: true,
      failedLoginCount: 0,
      lockoutUntil: null,
    });
    await admin.save();
    console.log(`Created Admin user: ${admin.email}`);
  } else {
    admin.name = process.env.SEED_ADMIN_NAME || 'Rajesh Sharma';
    admin.phone = process.env.SEED_ADMIN_PHONE || '9820123456';
    admin.password = adminPassword; // Will trigger pre-save bcrypt hash
    admin.role = 'Admin';
    admin.isActive = true;
    admin.failedLoginCount = 0;
    admin.lockoutUntil = null;
    await admin.save();
    console.log(`Updated Admin user: ${admin.email}`);
  }

  // 2. Seed or update Manager
  let manager = await User.findOne({ email: process.env.SEED_MANAGER_EMAIL || 'priya.nair@acxiomcrm.internal' });
  if (!manager) {
    manager = new User({
      name: process.env.SEED_MANAGER_NAME || 'Priya Nair',
      email: (process.env.SEED_MANAGER_EMAIL || 'priya.nair@acxiomcrm.internal').toLowerCase(),
      phone: process.env.SEED_MANAGER_PHONE || '9833123456',
      password: managerPassword,
      role: 'Manager',
      isActive: true,
      failedLoginCount: 0,
      lockoutUntil: null,
    });
    await manager.save();
    console.log(`Created Manager user: ${manager.email}`);
  } else {
    manager.name = process.env.SEED_MANAGER_NAME || 'Priya Nair';
    manager.phone = process.env.SEED_MANAGER_PHONE || '9833123456';
    manager.password = managerPassword;
    manager.role = 'Manager';
    manager.isActive = true;
    manager.failedLoginCount = 0;
    manager.lockoutUntil = null;
    await manager.save();
    console.log(`Updated Manager user: ${manager.email}`);
  }

  // 3. Seed or update SalesExecutive (reporting to Manager)
  let exec = await User.findOne({ email: process.env.SEED_EXEC_EMAIL || 'amit.patel@acxiomcrm.internal' });
  if (!exec) {
    exec = new User({
      name: process.env.SEED_EXEC_NAME || 'Amit Patel',
      email: (process.env.SEED_EXEC_EMAIL || 'amit.patel@acxiomcrm.internal').toLowerCase(),
      phone: process.env.SEED_EXEC_PHONE || '9844123456',
      password: execPassword,
      role: 'SalesExecutive',
      reportingTo: manager._id,
      isActive: true,
      failedLoginCount: 0,
      lockoutUntil: null,
    });
    await exec.save();
    console.log(`Created SalesExecutive user: ${exec.email}`);
  } else {
    exec.name = process.env.SEED_EXEC_NAME || 'Amit Patel';
    exec.phone = process.env.SEED_EXEC_PHONE || '9844123456';
    exec.password = execPassword;
    exec.role = 'SalesExecutive';
    exec.reportingTo = manager._id;
    exec.isActive = true;
    exec.failedLoginCount = 0;
    exec.lockoutUntil = null;
    await exec.save();
    console.log(`Updated SalesExecutive user: ${exec.email}`);
  }

  console.log('\n--- Seed Summary ---');
  console.log(`1. Admin:          ${admin.email} (Name: ${admin.name}, Role: ${admin.role})`);
  console.log(`2. Manager:        ${manager.email} (Name: ${manager.name}, Role: ${manager.role})`);
  console.log(`3. SalesExecutive: ${exec.email} (Name: ${exec.name}, Role: ${exec.role})`);
  console.log('--------------------\n');

  await mongoose.disconnect();
  console.log('Seed completed successfully. Database disconnected.');
};

seedUsers().catch((err) => {
  console.error('Seed process failed:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});

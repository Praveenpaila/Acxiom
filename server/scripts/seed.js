const path = require('path');
const dotenv = require('dotenv');

// Ensure environment variables are loaded from the server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');

const seedData = async () => {
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
    admin.password = adminPassword;
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

  // 4. Seed realistic Indian enterprise customers
  const sampleCustomers = [
    {
      customerCode: 'CUST-1001',
      name: 'Rohan Mehra',
      company: 'Tata Consultancy Services',
      email: 'rohan.mehra@tcs-demo.in',
      phone: '9820011223',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: 'TCS House, Raveline Street, Fort',
      status: 'Active',
      createdBy: admin._id,
    },
    {
      customerCode: 'CUST-1002',
      name: 'Ananya Deshmukh',
      company: 'Infosys Limited',
      email: 'ananya.deshmukh@infosys-demo.in',
      phone: '9833011223',
      city: 'Bengaluru',
      state: 'Karnataka',
      address: 'Electronics City, Hosur Road',
      status: 'Active',
      createdBy: manager._id,
    },
    {
      customerCode: 'CUST-1003',
      name: 'Vikram Singhania',
      company: 'Reliance Retail Ventures',
      email: 'vikram.singhania@reliance-demo.in',
      phone: '9844011223',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: 'Maker Chambers IV, Nariman Point',
      status: 'Active',
      createdBy: exec._id,
    },
    {
      customerCode: 'CUST-1004',
      name: 'Sneha Kulkarni',
      company: 'HDFC Bank Corporate',
      email: 'sneha.kulkarni@hdfc-demo.in',
      phone: '9855011223',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: 'HDFC Bank House, Senapati Bapat Marg',
      status: 'Active',
      createdBy: exec._id,
    },
    {
      customerCode: 'CUST-1005',
      name: 'Karthik Ramanathan',
      company: 'Bharti Airtel Enterprise',
      email: 'karthik.raman@airtel-demo.in',
      phone: '9866011223',
      city: 'Gurugram',
      state: 'Haryana',
      address: 'Airtel Center, Plot 16, Udyog Vihar',
      status: 'Active',
      createdBy: manager._id,
    },
    {
      customerCode: 'CUST-1006',
      name: 'Deepak Chawla',
      company: 'Mahindra & Mahindra',
      email: 'deepak.chawla@mahindra-demo.in',
      phone: '9877011223',
      city: 'Pune',
      state: 'Maharashtra',
      address: 'Mahindra Towers, Akurli Road',
      status: 'Active',
      createdBy: admin._id,
    },
  ];

  for (const cData of sampleCustomers) {
    const existing = await Customer.findOne({
      $or: [{ email: cData.email }, { phone: cData.phone }],
    });

    if (!existing) {
      await Customer.create(cData);
      console.log(`Seeded Customer: ${cData.customerCode} - ${cData.company}`);
    } else {
      await Customer.findByIdAndUpdate(existing._id, cData);
      console.log(`Updated Customer: ${cData.customerCode} - ${cData.company}`);
    }
  }

  // 5. Seed realistic Indian enterprise leads
  const sampleLeads = [
    {
      leadCode: 'LEAD-1001',
      name: 'Aditi Rao',
      email: 'aditi.rao@zomato-demo.in',
      phone: '9811002233',
      company: 'Zomato Media Private Limited',
      source: 'LinkedIn',
      status: 'New',
      expectedValue: 450000,
      assignedTo: exec._id,
      createdBy: exec._id,
      notes: 'Expressed interest in multi-region sales pipeline module.',
    },
    {
      leadCode: 'LEAD-1002',
      name: 'Kunal Shah',
      email: 'kunal@cred-demo.in',
      phone: '9822002233',
      company: 'Dreamplug Technologies (CRED)',
      source: 'Referral',
      status: 'Contacted',
      expectedValue: 800000,
      assignedTo: exec._id,
      createdBy: manager._id,
      notes: 'Initial discovery call held. Shared pricing matrix.',
    },
    {
      leadCode: 'LEAD-1003',
      name: 'Ritu Verma',
      email: 'ritu.verma@nykaa-demo.in',
      phone: '9833002233',
      company: 'FSN E-Commerce Ventures (Nykaa)',
      source: 'Website',
      status: 'Qualified',
      expectedValue: 1200000,
      assignedTo: manager._id,
      createdBy: manager._id,
      notes: 'Budget sanctioned for Q4. Ready for contract proposal.',
    },
    {
      leadCode: 'LEAD-1004',
      name: 'Harish Nambiar',
      email: 'harish@swiggy-demo.in',
      phone: '9844002233',
      company: 'Bundl Technologies (Swiggy)',
      source: 'Trade Show',
      status: 'Unqualified',
      expectedValue: 250000,
      assignedTo: exec._id,
      createdBy: exec._id,
      notes: 'Timing not right. Follow up next fiscal year.',
    },
    {
      leadCode: 'LEAD-1005',
      name: 'Pooja Bhatt',
      email: 'pooja@paytm-demo.in',
      phone: '9855002233',
      company: 'One97 Communications (Paytm)',
      source: 'Cold Call',
      status: 'Lost',
      expectedValue: 600000,
      assignedTo: admin._id,
      createdBy: admin._id,
      notes: 'Chose competitor for in-house payment integration.',
    },
  ];

  for (const lData of sampleLeads) {
    const existing = await Lead.findOne({ email: lData.email });
    if (!existing) {
      await Lead.create(lData);
      console.log(`Seeded Lead: ${lData.leadCode} - ${lData.company}`);
    } else {
      await Lead.findByIdAndUpdate(existing._id, lData);
      console.log(`Updated Lead: ${lData.leadCode} - ${lData.company}`);
    }
  }

  console.log('\n--- Seed Summary ---');
  console.log(`1. Admin:          ${admin.email} (Name: ${admin.name}, Role: ${admin.role})`);
  console.log(`2. Manager:        ${manager.email} (Name: ${manager.name}, Role: ${manager.role})`);
  console.log(`3. SalesExecutive: ${exec.email} (Name: ${exec.name}, Role: ${exec.role})`);
  console.log(`Seeded 6 Customers and 5 Leads across roles.`);
  console.log('--------------------\n');

  await mongoose.disconnect();
  console.log('Seed completed successfully. Database disconnected.');
};

seedData().catch((err) => {
  console.error('Seed process failed:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});

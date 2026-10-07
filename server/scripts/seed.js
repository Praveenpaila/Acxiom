const path = require('path');
const dotenv = require('dotenv');

// Ensure environment variables are loaded from the server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');
const Opportunity = require('../models/Opportunity');

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

  // 6. Seed realistic follow-up activities (Call, Meeting, Email, Task)
  const tcsCust = await Customer.findOne({ customerCode: 'CUST-1001' });
  const infosysCust = await Customer.findOne({ customerCode: 'CUST-1002' });
  const nykaaLead = await Lead.findOne({ leadCode: 'LEAD-1003' });
  const zomatoLead = await Lead.findOne({ leadCode: 'LEAD-1001' });

  const sampleFollowUps = [
    {
      type: 'Meeting',
      title: 'TCS Executive RFP Presentation',
      description: 'Review multi-region CRM scaling architecture with Rohan Mehra.',
      customerId: tcsCust?._id,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      status: 'Pending',
      priority: 'High',
      assignedTo: admin._id,
      createdBy: admin._id,
    },
    {
      type: 'Call',
      title: 'Nykaa Q4 Budget Discussion',
      description: 'Discuss commercial milestones and user licensing with Ritu Verma.',
      leadId: nykaaLead?._id,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      status: 'Pending',
      priority: 'High',
      assignedTo: manager._id,
      createdBy: manager._id,
    },
    {
      type: 'Email',
      title: 'Send Enterprise SLA Document to Infosys',
      description: 'Deliver signed 99.9% uptime SLA and disaster recovery plan.',
      customerId: infosysCust?._id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'Pending',
      priority: 'Medium',
      assignedTo: manager._id,
      createdBy: manager._id,
    },
    {
      type: 'Task',
      title: 'Prepare Zomato Pilot Environment',
      description: 'Provision staging tenant with custom Indian GST invoicing template.',
      leadId: zomatoLead?._id,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      status: 'Pending',
      priority: 'Medium',
      assignedTo: exec._id,
      createdBy: exec._id,
    },
    {
      type: 'Call',
      title: 'Overdue: Follow-up on Initial CRED Demo',
      description: 'Check in with procurement lead regarding technical clearance.',
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Overdue: yesterday
      status: 'Pending',
      priority: 'Urgent',
      assignedTo: exec._id,
      createdBy: exec._id,
    },
    {
      type: 'Meeting',
      title: 'Kickoff Call with TCS Procurement',
      description: 'Initial vendor onboarding call completed.',
      customerId: tcsCust?._id,
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'Completed',
      priority: 'Medium',
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      completedNotes: 'Vendor code assigned: VC-98124. NDA executed.',
      assignedTo: admin._id,
      createdBy: admin._id,
    },
  ];

  for (const fData of sampleFollowUps) {
    const existing = await FollowUp.findOne({ title: fData.title });
    if (!existing) {
      await FollowUp.create(fData);
      console.log(`Seeded FollowUp: [${fData.type}] ${fData.title}`);
    } else {
      await FollowUp.findByIdAndUpdate(existing._id, fData);
      console.log(`Updated FollowUp: [${fData.type}] ${fData.title}`);
    }
  }

  // 7. Seed realistic sales opportunities
  const relianceCust = await Customer.findOne({ customerCode: 'CUST-1003' });
  const hdfcCust = await Customer.findOne({ customerCode: 'CUST-1004' });
  const airtelCust = await Customer.findOne({ customerCode: 'CUST-1005' });

  const sampleOpportunities = [
    {
      name: 'TCS Global Cloud Modernization',
      customerId: tcsCust?._id,
      amount: 3500000,
      stage: 'Proposal',
      probability: 50,
      expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      status: 'Open',
      assignedTo: admin._id,
      createdBy: admin._id,
      notes: 'Submitted RFP documentation. Decision committee meets next month.',
    },
    {
      name: 'Infosys Analytics Infrastructure',
      customerId: infosysCust?._id,
      amount: 2200000,
      stage: 'Negotiation',
      probability: 80,
      expectedCloseDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      status: 'Open',
      assignedTo: manager._id,
      createdBy: manager._id,
      notes: 'Commercial terms agreed. Final legal contract review in progress.',
    },
    {
      name: 'Reliance Retail POS Expansion',
      customerId: relianceCust?._id,
      amount: 1850000,
      stage: 'Qualification',
      probability: 25,
      expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      status: 'Open',
      assignedTo: exec._id,
      createdBy: exec._id,
      notes: 'Initial scope assessment for 150 retail stores.',
    },
    {
      name: 'HDFC Corporate Digital Integration',
      customerId: hdfcCust?._id,
      amount: 4800000,
      stage: 'Won',
      probability: 100,
      expectedCloseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'Won',
      assignedTo: exec._id,
      createdBy: exec._id,
      notes: 'Contract signed. Advanced billing payment received.',
    },
    {
      name: 'Bharti Airtel 5G Gateway Deal',
      customerId: airtelCust?._id,
      amount: 1500000,
      stage: 'Lost',
      probability: 0,
      expectedCloseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: 'Lost',
      assignedTo: manager._id,
      createdBy: manager._id,
      notes: 'Budget redirected towards core infrastructure vendor.',
    },
  ];

  for (const oData of sampleOpportunities) {
    const existing = await Opportunity.findOne({ name: oData.name });
    if (!existing) {
      await Opportunity.create(oData);
      console.log(`Seeded Opportunity: ${oData.name} (₹ ${oData.amount})`);
    } else {
      await Opportunity.findByIdAndUpdate(existing._id, oData);
      console.log(`Updated Opportunity: ${oData.name} (₹ ${oData.amount})`);
    }
  }

  console.log('\n--- Seed Summary ---');
  console.log(`1. Admin:          ${admin.email} (Name: ${admin.name}, Role: ${admin.role})`);
  console.log(`2. Manager:        ${manager.email} (Name: ${manager.name}, Role: ${manager.role})`);
  console.log(`3. SalesExecutive: ${exec.email} (Name: ${exec.name}, Role: ${exec.role})`);
  console.log(`Seeded Customers, Leads, Follow-Ups, and Opportunities across roles.`);
  console.log('--------------------\n');

  await mongoose.disconnect();
  console.log('Seed completed successfully. Database disconnected.');
};

seedData().catch((err) => {
  console.error('Seed process failed:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});

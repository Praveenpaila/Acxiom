const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const Opportunity = require('../models/Opportunity');

const PORT = 5007;

const runTests = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/acxiom_crm';
  await mongoose.connect(uri);

  const server = app.listen(PORT);
  const baseUrl = `http://127.0.0.1:${PORT}/api`;

  let passed = 0;
  let failed = 0;

  const assert = (condition, description) => {
    if (condition) {
      console.log(`[PASS] ${description}`);
      passed++;
    } else {
      console.error(`[FAIL] ${description}`);
      failed++;
    }
  };

  try {
    const getAuthCookie = async (email, password) => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const cookieHeader = res.headers.get('set-cookie');
      const match = cookieHeader ? cookieHeader.match(/token=([^;]+)/) : null;
      return match ? `token=${match[1]}` : '';
    };

    const adminCookie = await getAuthCookie('rajesh.sharma@acxiomcrm.internal', process.env.SEED_ADMIN_PASSWORD || 'Admin@Acxiom2026!');
    const managerCookie = await getAuthCookie('priya.nair@acxiomcrm.internal', process.env.SEED_MANAGER_PASSWORD || 'Manager@Acxiom2026!');
    const execCookie = await getAuthCookie('amit.patel@acxiomcrm.internal', process.env.SEED_EXEC_PASSWORD || 'Sales@Acxiom2026!');

    // 1. Role-based scoping tests
    const adminListRes = await fetch(`${baseUrl}/leads`, { headers: { Cookie: adminCookie } });
    const adminListData = await adminListRes.json();
    assert(adminListRes.status === 200 && adminListData.pagination.total >= 5, 'Admin sees all leads (total >= 5)');

    const managerListRes = await fetch(`${baseUrl}/leads`, { headers: { Cookie: managerCookie } });
    const managerListData = await managerListRes.json();
    assert(managerListRes.status === 200 && managerListData.pagination.total >= 3, 'Manager sees team leads');

    const execListRes = await fetch(`${baseUrl}/leads`, { headers: { Cookie: execCookie } });
    const execListData = await execListRes.json();
    assert(execListRes.status === 200 && execListData.pagination.total >= 3, 'SalesExecutive sees assigned/created leads');

    // 2. Validation tests on lead creation
    const invalidPhoneRes = await fetch(`${baseUrl}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: execCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        name: 'Razorpay Prospect',
        email: 'prospect@razorpay-demo.in',
        phone: '12345',
        company: 'Razorpay Software',
      }),
    });
    const invalidPhoneData = await invalidPhoneRes.json();
    assert(
      invalidPhoneRes.status === 400 && invalidPhoneData.message === 'Enter a valid phone number.',
      'Lead creation rejects invalid phone with "Enter a valid phone number."'
    );

    const invalidEmailRes = await fetch(`${baseUrl}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: execCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        name: 'Razorpay Prospect',
        email: 'bad-email-format',
        phone: '9811223344',
        company: 'Razorpay Software',
      }),
    });
    const invalidEmailData = await invalidEmailRes.json();
    assert(
      invalidEmailRes.status === 400 && invalidEmailData.message === 'Enter a valid email address.',
      'Lead creation rejects invalid email with "Enter a valid email address."'
    );

    // 3. Create a new lead
    await Lead.deleteOne({ email: 'sachin@zepto-demo.in' });
    const createRes = await fetch(`${baseUrl}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: execCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        name: 'Sachin Bansal',
        email: 'sachin@zepto-demo.in',
        phone: '9876543210',
        company: 'Kiranakart Technologies (Zepto)',
        source: 'Website',
        expectedValue: 500000,
        notes: 'Hyperlocal delivery integration lead.',
      }),
    });
    const createData = await createRes.json();
    assert(
      createRes.status === 201 && createData.lead?.status === 'New' && createData.lead?.leadCode?.startsWith('LEAD-'),
      'Creates lead with status "New" and auto-generated leadCode'
    );
    const leadId = createData.lead.id;

    // 4. Invalid status transition: New -> Converted (should fail with 400)
    const invalidTransRes = await fetch(`${baseUrl}/leads/${leadId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: execCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ status: 'Converted' }),
    });
    assert(invalidTransRes.status === 400, 'Direct transition from New to Converted is rejected (400)');

    // 5. Valid transition: New -> Contacted
    const validTrans1 = await fetch(`${baseUrl}/leads/${leadId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: execCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ status: 'Contacted' }),
    });
    const transData1 = await validTrans1.json();
    assert(validTrans1.status === 200 && transData1.lead.status === 'Contacted', 'Valid status transition New -> Contacted succeeds');

    // 6. Valid transition: Contacted -> Qualified
    const validTrans2 = await fetch(`${baseUrl}/leads/${leadId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: execCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ status: 'Qualified' }),
    });
    const transData2 = await validTrans2.json();
    assert(validTrans2.status === 200 && transData2.lead.status === 'Qualified', 'Valid status transition Contacted -> Qualified succeeds');

    // 7. Convert qualified lead -> Customer + Opportunity
    const convertRes = await fetch(`${baseUrl}/leads/${leadId}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: execCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        dealName: 'Zepto Enterprise Pilot Contract',
        amount: 650000,
        expectedCloseDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
    const convertData = await convertRes.json();
    assert(
      convertRes.status === 200 &&
      convertData.lead?.status === 'Converted' &&
      convertData.customer?.company === 'Kiranakart Technologies (Zepto)' &&
      Boolean(convertData.opportunityId),
      'Converts Qualified lead to Customer and Opportunity and marks lead Converted'
    );

    // 8. Attempting to convert again fails (400)
    const reConvertRes = await fetch(`${baseUrl}/leads/${leadId}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: execCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({}),
    });
    assert(reConvertRes.status === 400, 'Re-converting an already converted lead is rejected (400)');

    // 9. Search leads
    const searchRes = await fetch(`${baseUrl}/leads?search=Zomato`, {
      headers: { Cookie: adminCookie },
    });
    const searchData = await searchRes.json();
    assert(searchRes.status === 200 && searchData.leads.some((l) => l.company.includes('Zomato')), 'Search leads by keyword returns match');

    // Cleanup created lead and associated records
    await Lead.deleteOne({ _id: leadId });
    if (convertData.customer?.id) {
      await Customer.deleteOne({ _id: convertData.customer.id });
    }
    if (convertData.opportunityId) {
      await Opportunity.deleteOne({ _id: convertData.opportunityId });
    }

    console.log(`\n========================================`);
    console.log(`Leads Tests Passed: ${passed} | Failed: ${failed}`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('Lead test execution error:', err);
    failed++;
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();

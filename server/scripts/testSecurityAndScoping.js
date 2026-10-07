const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../app');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Opportunity = require('../models/Opportunity');
const FollowUp = require('../models/FollowUp');

const PORT = 5011;
let server;

function makeRequest({ method = 'GET', path = '/', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = { ...headers };

    if (payload) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsed = data;
          if (res.headers['content-type']?.includes('application/json')) {
            try {
              parsed = JSON.parse(data);
            } catch (e) {
              parsed = data;
            }
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return cookieStr.split(';')[0];
}

async function loginUser(email, password) {
  const res = await makeRequest({
    method: 'POST',
    path: '/api/auth/login',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    body: { email, password },
  });
  return {
    status: res.status,
    cookie: extractCookie(res.headers),
    user: res.body?.user,
  };
}

async function runTests() {
  console.log('--- STARTING PHASE 11: SECURITY & ROLE-BASED SCOPING AUDIT ---');

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/acxiom_crm';
  await mongoose.connect(mongoUri);

  server = app.listen(PORT);
  await new Promise((r) => setTimeout(r, 600));

  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  try {
    const adminLogin = await loginUser('rajesh.sharma@acxiomcrm.internal', 'Admin@Acxiom2026!');
    const managerLogin = await loginUser('priya.nair@acxiomcrm.internal', 'Manager@Acxiom2026!');
    const salesLogin = await loginUser('amit.patel@acxiomcrm.internal', 'Sales@Acxiom2026!');

    // 1. Create a confidential Admin-owned Customer, Lead, Opportunity, FollowUp
    const adminCustomerRes = await makeRequest({
      method: 'POST',
      path: '/api/customers',
      headers: {
        Cookie: adminLogin.cookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: {
        name: 'Secret Enterprise VIP',
        email: `vip.${Date.now()}@classified.internal`,
        phone: `99112${Math.floor(10000 + Math.random() * 90000)}`,
        company: 'Classified Defense Corp',
      },
    });
    assert('Admin creates confidential customer (201)', adminCustomerRes.status === 201);
    const adminCustId = adminCustomerRes.body.customer.id;

    const adminLeadRes = await makeRequest({
      method: 'POST',
      path: '/api/leads',
      headers: {
        Cookie: adminLogin.cookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: {
        name: 'Defense Director',
        email: `director.${Date.now()}@classified.internal`,
        phone: `99223${Math.floor(10000 + Math.random() * 90000)}`,
        company: 'Classified Defense Corp',
        assignedTo: adminLogin.user.id,
      },
    });
    assert('Admin creates confidential lead (201)', adminLeadRes.status === 201);
    const adminLeadId = adminLeadRes.body.lead.id;

    const adminOppRes = await makeRequest({
      method: 'POST',
      path: '/api/opportunities',
      headers: {
        Cookie: adminLogin.cookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: {
        name: 'Confidential Defense Project',
        customerId: adminCustId,
        amount: 8500000,
        expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        assignedTo: adminLogin.user.id,
      },
    });
    assert('Admin creates confidential opportunity (201)', adminOppRes.status === 201);
    const adminOppId = adminOppRes.body.opportunity?.id || adminOppRes.body.opportunity?._id;

    const adminFollowRes = await makeRequest({
      method: 'POST',
      path: '/api/followups',
      headers: {
        Cookie: adminLogin.cookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: {
        type: 'Meeting',
        title: 'Secret Defense Board Meeting',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        assignedTo: adminLogin.user.id,
      },
    });
    assert('Admin creates confidential activity (201)', adminFollowRes.status === 201);
    const adminFollowId = adminFollowRes.body.followUp?.id || adminFollowRes.body.followUp?._id;

    // 2. Tampering Attack: SalesExecutive attempts to access Admin's records
    const salesAccessCust = await makeRequest({
      method: 'GET',
      path: `/api/customers/${adminCustId}`,
      headers: { Cookie: salesLogin.cookie },
    });
    assert('SalesExecutive blocked from GET Admin customer (403)', salesAccessCust.status === 403);

    const salesUpdateCust = await makeRequest({
      method: 'PUT',
      path: `/api/customers/${adminCustId}`,
      headers: {
        Cookie: salesLogin.cookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: { name: 'Hacked Name' },
    });
    assert('SalesExecutive blocked from PUT Admin customer (403)', salesUpdateCust.status === 403);

    const salesAccessLead = await makeRequest({
      method: 'GET',
      path: `/api/leads/${adminLeadId}`,
      headers: { Cookie: salesLogin.cookie },
    });
    assert('SalesExecutive blocked from GET Admin lead (403)', salesAccessLead.status === 403);

    const salesAccessOpp = await makeRequest({
      method: 'GET',
      path: `/api/opportunities/${adminOppId}`,
      headers: { Cookie: salesLogin.cookie },
    });
    assert('SalesExecutive blocked from GET Admin opportunity (403)', salesAccessOpp.status === 403);

    const salesAccessFollow = await makeRequest({
      method: 'GET',
      path: `/api/followups/${adminFollowId}`,
      headers: { Cookie: salesLogin.cookie },
    });
    assert('SalesExecutive blocked from GET Admin activity (403)', salesAccessFollow.status === 403);

    // 3. Manager Access: Manager should NOT see Admin's private records if Admin is not in Manager's team
    const managerAccessCust = await makeRequest({
      method: 'GET',
      path: `/api/customers/${adminCustId}`,
      headers: { Cookie: managerLogin.cookie },
    });
    assert('Manager blocked from GET Admin private customer (403)', managerAccessCust.status === 403);

    // 4. CSRF Protection Check: Missing X-Requested-With on state change
    const missingCsrfRes = await makeRequest({
      method: 'POST',
      path: '/api/customers',
      headers: {
        Cookie: adminLogin.cookie,
        // No X-Requested-With header!
      },
      body: {
        name: 'CSRF Exploit Attempt',
        email: 'csrf@bad.com',
        phone: '9876543210',
        company: 'Bad Inc',
      },
    });
    assert('Cookie request without CSRF protection header rejected (403)', missingCsrfRes.status === 403);

    // Clean up created test entities
    await Customer.findByIdAndDelete(adminCustId);
    await Lead.findByIdAndDelete(adminLeadId);
    await Opportunity.findByIdAndDelete(adminOppId);
    await FollowUp.findByIdAndDelete(adminFollowId);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  }
}

runTests();

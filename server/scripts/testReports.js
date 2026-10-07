const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../app');

const PORT = 5010;
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
  console.log('--- STARTING PHASE 10: REPORTS & ANALYTICS TEST SUITE ---');

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

    // 1. Dashboard KPIs for Admin
    const adminStats = await makeRequest({
      method: 'GET',
      path: '/api/dashboard/stats',
      headers: { Cookie: adminLogin.cookie },
    });
    assert('Admin can fetch dashboard stats (200)', adminStats.status === 200 && adminStats.body.success);
    assert('Admin stats contain KPIs', typeof adminStats.body.stats?.kpis?.totalCustomers === 'number');
    assert('Admin stats contain charts', Boolean(adminStats.body.stats?.charts?.leadsByStatus));
    assert('Admin stats contain team leaderboard', Array.isArray(adminStats.body.stats?.teamPerformance));

    // 2. Dashboard KPIs for SalesExecutive
    const salesStats = await makeRequest({
      method: 'GET',
      path: '/api/dashboard/stats',
      headers: { Cookie: salesLogin.cookie },
    });
    assert('SalesExecutive can fetch scoped dashboard stats (200)', salesStats.status === 200 && salesStats.body.success);

    // 3. Tabular reports
    const custReport = await makeRequest({
      method: 'GET',
      path: '/api/reports/customers',
      headers: { Cookie: adminLogin.cookie },
    });
    assert('Customer report returns columns and data (200)', custReport.status === 200 && Array.isArray(custReport.body.columns) && Array.isArray(custReport.body.data));

    const leadReport = await makeRequest({
      method: 'GET',
      path: '/api/reports/leads',
      headers: { Cookie: adminLogin.cookie },
    });
    assert('Lead report returns columns and data (200)', leadReport.status === 200 && Array.isArray(leadReport.body.columns));

    const oppReport = await makeRequest({
      method: 'GET',
      path: '/api/reports/opportunities',
      headers: { Cookie: adminLogin.cookie },
    });
    assert('Opportunity report returns columns and data (200)', oppReport.status === 200 && Array.isArray(oppReport.body.columns));

    const followReport = await makeRequest({
      method: 'GET',
      path: '/api/reports/followups',
      headers: { Cookie: adminLogin.cookie },
    });
    assert('Follow-up report returns columns and data (200)', followReport.status === 200 && Array.isArray(followReport.body.columns));

    // 4. CSV Exports
    const custCsv = await makeRequest({
      method: 'GET',
      path: '/api/reports/customers/export',
      headers: { Cookie: adminLogin.cookie },
    });
    assert('Customer CSV export returns text/csv (200)', custCsv.status === 200 && custCsv.headers['content-type']?.includes('text/csv'));
    assert('Customer CSV has header row with Customer Code', typeof custCsv.body === 'string' && custCsv.body.includes('Customer Code'));

    const oppCsv = await makeRequest({
      method: 'GET',
      path: '/api/reports/opportunities/export',
      headers: { Cookie: adminLogin.cookie },
    });
    assert('Opportunity CSV export returns text/csv (200)', oppCsv.status === 200 && oppCsv.headers['content-type']?.includes('text/csv'));
    assert('Opportunity CSV has header row with Opportunity Name', typeof oppCsv.body === 'string' && oppCsv.body.includes('Opportunity Name'));

    // 5. Invalid report type returns 400
    const invalidReport = await makeRequest({
      method: 'GET',
      path: '/api/reports/invalid_xyz',
      headers: { Cookie: adminLogin.cookie },
    });
    assert('Invalid report type returns 400', invalidReport.status === 400);

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

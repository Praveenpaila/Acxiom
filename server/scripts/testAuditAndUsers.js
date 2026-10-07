const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../app');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Customer = require('../models/Customer');

const PORT = 5009;
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
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
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
  console.log('--- STARTING PHASE 8: AUDIT LOG & USER MANAGEMENT SUITE ---');

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
    // 1. Log in as Admin, Manager, SalesExecutive
    const adminLogin = await loginUser('rajesh.sharma@acxiomcrm.internal', 'Admin@Acxiom2026!');
    const managerLogin = await loginUser('priya.nair@acxiomcrm.internal', 'Manager@Acxiom2026!');
    const salesLogin = await loginUser('amit.patel@acxiomcrm.internal', 'Sales@Acxiom2026!');

    assert('Admin login successful', adminLogin.status === 200 && Boolean(adminLogin.cookie));
    assert('Manager login successful', managerLogin.status === 200 && Boolean(managerLogin.cookie));

    // 2. Access control on User Management
    const nonAdminUserList = await makeRequest({
      method: 'GET',
      path: '/api/users',
      headers: { Cookie: salesLogin.cookie },
    });
    assert('SalesExecutive cannot list users (403)', nonAdminUserList.status === 403);

    const managerUserList = await makeRequest({
      method: 'GET',
      path: '/api/users',
      headers: { Cookie: managerLogin.cookie },
    });
    assert('Manager cannot list users (403)', managerUserList.status === 403);

    const adminUserList = await makeRequest({
      method: 'GET',
      path: '/api/users',
      headers: { Cookie: adminLogin.cookie },
    });
    assert('Admin can list users (200)', adminUserList.status === 200 && Array.isArray(adminUserList.body.users));

    // 3. Any authenticated user can fetch assignable users
    const assignable = await makeRequest({
      method: 'GET',
      path: '/api/users/assignable',
      headers: { Cookie: salesLogin.cookie },
    });
    assert('SalesExecutive can fetch assignable users (200)', assignable.status === 200 && assignable.body.users.length >= 3);

    // 4. Admin creates a new Sales Executive user
    const testEmail = `neha.verma.${Date.now()}@acxiomcrm.internal`;
    const testPhone = `98765${Math.floor(10000 + Math.random() * 90000)}`;

    const createRes = await makeRequest({
      method: 'POST',
      path: '/api/users',
      headers: {
        Cookie: adminLogin.cookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: {
        name: 'Neha Verma',
        email: testEmail,
        phone: testPhone,
        password: 'Password@2026!',
        role: 'SalesExecutive',
        reportingTo: managerLogin.user.id,
      },
    });
    assert('Admin can create a new user (201)', createRes.status === 201 && createRes.body.user.email === testEmail);
    const createdUserId = createRes.body?.user?.id;

    // 5. Admin updates the user
    const updateRes = await makeRequest({
      method: 'PUT',
      path: `/api/users/${createdUserId}`,
      headers: {
        Cookie: adminLogin.cookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: {
        name: 'Neha V. Sharma',
      },
    });
    assert('Admin can update user name (200)', updateRes.status === 200 && updateRes.body.user.name === 'Neha V. Sharma');

    // 6. Admin toggles user status (deactivate & reactivate)
    const deactivateRes = await makeRequest({
      method: 'PATCH',
      path: `/api/users/${createdUserId}/status`,
      headers: {
        Cookie: adminLogin.cookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: { isActive: false },
    });
    assert('Admin can deactivate user (200)', deactivateRes.status === 200 && deactivateRes.body.user.isActive === false);

    // Verify deactivated user cannot log in
    const deactLogin = await loginUser(testEmail, 'Password@2026!');
    assert('Deactivated user cannot log in (403)', deactLogin.status === 403);

    // Reactivate user
    const reactivateRes = await makeRequest({
      method: 'PATCH',
      path: `/api/users/${createdUserId}/status`,
      headers: {
        Cookie: adminLogin.cookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: { isActive: true },
    });
    assert('Admin can reactivate user (200)', reactivateRes.status === 200 && reactivateRes.body.user.isActive === true);

    // 7. Admin cannot deactivate own admin account (400)
    const selfDeact = await makeRequest({
      method: 'PATCH',
      path: `/api/users/${adminLogin.user.id}/status`,
      headers: {
        Cookie: adminLogin.cookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: { isActive: false },
    });
    assert('Admin cannot deactivate their own account (400)', selfDeact.status === 400);

    // 8. Admin can reset password
    const resetPwRes = await makeRequest({
      method: 'POST',
      path: `/api/users/${createdUserId}/reset-password`,
      headers: {
        Cookie: adminLogin.cookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: { password: 'NewSecurePass@2026!' },
    });
    assert('Admin can reset user password (200)', resetPwRes.status === 200);

    // Log in with new password
    const newPwLogin = await loginUser(testEmail, 'NewSecurePass@2026!');
    assert('User can log in with reset password (200)', newPwLogin.status === 200);

    // 9. Audit Logs Access Control
    const nonAdminAudit = await makeRequest({
      method: 'GET',
      path: '/api/audit',
      headers: { Cookie: salesLogin.cookie },
    });
    assert('SalesExecutive cannot inspect audit logs (403)', nonAdminAudit.status === 403);

    const adminAudit = await makeRequest({
      method: 'GET',
      path: '/api/audit',
      headers: { Cookie: adminLogin.cookie },
    });
    assert('Admin can inspect audit logs (200)', adminAudit.status === 200 && Array.isArray(adminAudit.body.logs));
    assert('Audit logs contain records', adminAudit.body.logs.length > 0);

    // 10. Audit Log Immutability Test
    const firstLogId = adminAudit.body.logs[0]._id;
    let updateThrew = false;
    try {
      await AuditLog.updateOne({ _id: firstLogId }, { action: 'TAMPERED' });
    } catch (e) {
      updateThrew = true;
    }
    assert('Audit logs are immutable: updateOne throws error', updateThrew);

    let deleteThrew = false;
    try {
      await AuditLog.deleteOne({ _id: firstLogId });
    } catch (e) {
      deleteThrew = true;
    }
    assert('Audit logs are immutable: deleteOne throws error', deleteThrew);

    // Clean up created test user
    await User.findByIdAndDelete(createdUserId);

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

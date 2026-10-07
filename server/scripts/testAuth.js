const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

const PORT = 5005; // Use test port

const runTests = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/acxiom_crm';
  await mongoose.connect(uri);

  const server = app.listen(PORT);
  const baseUrl = `http://127.0.0.1:${PORT}/api`;

  console.log(`Test server running at ${baseUrl}`);

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
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok', 'GET /api/health returns 200 ok');

    // 2. Validation tests on Registration
    const invalidEmailRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'invalid-email',
        phone: '9876543210',
        password: 'ValidPassword1!',
      }),
    });
    const invalidEmailData = await invalidEmailRes.json();
    assert(
      invalidEmailRes.status === 400 && invalidEmailData.message === 'Enter a valid email address.',
      'Rejects invalid email with exact error message "Enter a valid email address."'
    );

    const invalidPhoneRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@acxiom.com',
        phone: '12345', // Not 10 digits starting 6-9
        password: 'ValidPassword1!',
      }),
    });
    const invalidPhoneData = await invalidPhoneRes.json();
    assert(
      invalidPhoneRes.status === 400 && invalidPhoneData.message === 'Enter a valid phone number.',
      'Rejects invalid phone with exact error message "Enter a valid phone number."'
    );

    const weakPasswordRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@acxiom.com',
        phone: '9876543210',
        password: 'weak',
      }),
    });
    assert(weakPasswordRes.status === 400, 'Rejects weak password meeting length < 8');

    // Clean up test user if exists
    await User.deleteOne({ email: 'kavita.verma@acxiomcrm.internal' });

    // 3. Successful registration
    const validRegRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kavita Verma',
        email: 'kavita.verma@acxiomcrm.internal',
        phone: '9876543210',
        password: 'Password@2026!',
        role: 'SalesExecutive',
      }),
    });
    const validRegData = await validRegRes.json();
    const regSetCookie = validRegRes.headers.get('set-cookie');
    assert(
      validRegRes.status === 201 && validRegData.user?.email === 'kavita.verma@acxiomcrm.internal',
      'Register returns 201 and user DTO'
    );
    assert(
      validRegData.user?.password === undefined,
      'User DTO never includes password or hash'
    );
    assert(
      Boolean(regSetCookie && regSetCookie.includes('token=')),
      'Register sets HttpOnly token cookie'
    );

    // 4. Duplicate registration check
    const dupRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Kavita',
        email: 'kavita.verma@acxiomcrm.internal',
        phone: '9876543210',
        password: 'Password@2026!',
      }),
    });
    assert(dupRes.status === 409, 'Duplicate email/phone returns 409 Conflict');

    // 5. Login with seeded Admin
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rajesh.sharma@acxiomcrm.internal',
        password: process.env.SEED_ADMIN_PASSWORD || 'Admin@Acxiom2026!',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminCookie = adminLoginRes.headers.get('set-cookie');
    assert(
      adminLoginRes.status === 200 && adminLoginData.user?.role === 'Admin',
      'Admin logs in successfully with seeded credentials and role "Admin"'
    );
    assert(
      Boolean(adminCookie && adminCookie.includes('token=')),
      'Admin login returns HttpOnly cookie'
    );

    // 6. Test protected route /api/auth/me without cookie
    const unauthMeRes = await fetch(`${baseUrl}/auth/me`);
    assert(unauthMeRes.status === 401, 'GET /api/auth/me without auth returns 401');

    // Extract cookie value for authorized call
    const cookieTokenMatch = adminCookie.match(/token=([^;]+)/);
    const tokenValue = cookieTokenMatch ? cookieTokenMatch[1] : '';

    // 7. Test protected route /api/auth/me with cookie
    const authMeRes = await fetch(`${baseUrl}/auth/me`, {
      headers: {
        Cookie: `token=${tokenValue}`,
      },
    });
    const authMeData = await authMeRes.json();
    assert(
      authMeRes.status === 200 && authMeData.user?.email === 'rajesh.sharma@acxiomcrm.internal',
      'GET /api/auth/me with cookie returns 200 and correct user profile'
    );

    // 8. Test Account Lockout (5 failed attempts -> 15 min lock)
    // Create a temporary test account for lockout verification
    await User.deleteOne({ email: 'lockout.test@acxiomcrm.internal' });
    const lockoutUser = new User({
      name: 'Lockout Test',
      email: 'lockout.test@acxiomcrm.internal',
      phone: '9811223344',
      password: 'LockoutPassword@123',
      role: 'SalesExecutive',
    });
    await lockoutUser.save();

    for (let i = 1; i <= 5; i++) {
      const failRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'lockout.test@acxiomcrm.internal',
          password: 'WrongPassword!',
        }),
      });
      const failData = await failRes.json();

      if (i < 5) {
        assert(failRes.status === 401, `Failed attempt #${i} returns 401`);
      } else {
        assert(failRes.status === 403, `Failed attempt #${i} triggers 403 Lockout`);
      }
    }

    // 6th attempt while locked out
    const lockedRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'lockout.test@acxiomcrm.internal',
        password: 'LockoutPassword@123', // even with correct password!
      }),
    });
    const lockedData = await lockedRes.json();
    assert(
      lockedRes.status === 403 && lockedData.message.includes('temporarily locked'),
      'Account lockout prevents login even with correct credentials for 15 mins'
    );

    // Cleanup lockout user and test user
    await User.deleteOne({ email: 'lockout.test@acxiomcrm.internal' });
    await User.deleteOne({ email: 'kavita.verma@acxiomcrm.internal' });

    // 9. Logout
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    const logoutCookie = logoutRes.headers.get('set-cookie');
    assert(
      logoutRes.status === 200 && Boolean(logoutCookie && (logoutCookie.includes('token=;') || logoutCookie.includes('Max-Age=0'))),
      'Logout clears auth cookie'
    );

    console.log(`\n========================================`);
    console.log(`Total Passed: ${passed} | Failed: ${failed}`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();

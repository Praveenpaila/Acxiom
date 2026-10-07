const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Customer = require('../models/Customer');

const PORT = 5006;

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
    // Helper to log in a user and obtain cookie
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
    const adminListRes = await fetch(`${baseUrl}/customers`, { headers: { Cookie: adminCookie } });
    const adminListData = await adminListRes.json();
    assert(adminListRes.status === 200 && adminListData.pagination.total >= 6, 'Admin sees all customer records (total >= 6)');

    const managerListRes = await fetch(`${baseUrl}/customers`, { headers: { Cookie: managerCookie } });
    const managerListData = await managerListRes.json();
    assert(managerListRes.status === 200 && managerListData.pagination.total === 4, 'Manager sees team records (Manager + SalesExecutive = 4)');

    const execListRes = await fetch(`${baseUrl}/customers`, { headers: { Cookie: execCookie } });
    const execListData = await execListRes.json();
    assert(execListRes.status === 200 && execListData.pagination.total === 2, 'SalesExecutive sees only own records (2)');

    // 2. Ownership security check: SalesExecutive accessing Admin's customer ID
    const adminCustomer = await Customer.findOne({ customerCode: 'CUST-1001' });
    const unauthorizedAccessRes = await fetch(`${baseUrl}/customers/${adminCustomer._id}`, {
      headers: { Cookie: execCookie },
    });
    assert(
      unauthorizedAccessRes.status === 403,
      'SalesExecutive accessing another user customer ID returns 403 Forbidden (Ownership enforcement)'
    );

    // 3. Validation tests
    const invalidPhoneRes = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        name: 'Test Client',
        email: 'client@test.com',
        phone: '12345',
        company: 'Test Corp',
      }),
    });
    const invalidPhoneData = await invalidPhoneRes.json();
    assert(
      invalidPhoneRes.status === 400 && invalidPhoneData.message === 'Enter a valid phone number.',
      'Rejects invalid phone with exact message "Enter a valid phone number."'
    );

    const invalidEmailRes = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        name: 'Test Client',
        email: 'invalid-email-format',
        phone: '9899112233',
        company: 'Test Corp',
      }),
    });
    const invalidEmailData = await invalidEmailRes.json();
    assert(
      invalidEmailRes.status === 400 && invalidEmailData.message === 'Enter a valid email address.',
      'Rejects invalid email with exact message "Enter a valid email address."'
    );

    // 4. Duplicate checks
    const duplicateEmailRes = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        name: 'Duplicate Test',
        email: 'rohan.mehra@tcs-demo.in', // existing TCS email
        phone: '9899112244',
        company: 'Duplicate Corp',
      }),
    });
    assert(duplicateEmailRes.status === 409, 'Duplicate customer email returns 409 Conflict');

    const duplicatePhoneRes = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        name: 'Duplicate Phone Test',
        email: 'unique@corp.in',
        phone: '9820011223', // existing TCS phone
        company: 'Unique Corp',
      }),
    });
    assert(duplicatePhoneRes.status === 409, 'Duplicate customer phone returns 409 Conflict');

    // 5. Successful customer creation
    await Customer.deleteOne({ email: 'suresh.menon@wipro-demo.in' });
    const createRes = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: execCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        name: 'Suresh Menon',
        email: 'suresh.menon@wipro-demo.in',
        phone: '9899001122',
        company: 'Wipro Enterprises',
        city: 'Bengaluru',
        state: 'Karnataka',
        address: 'Sarjapur Road, Doddakannelli',
      }),
    });
    const createData = await createRes.json();
    assert(
      createRes.status === 201 && createData.customer?.customerCode?.startsWith('CUST-'),
      'Creates customer with auto-generated customerCode'
    );
    const createdId = createData.customer?.id;

    // 6. Search functionality
    const searchRes = await fetch(`${baseUrl}/customers?search=Tata`, {
      headers: { Cookie: adminCookie },
    });
    const searchData = await searchRes.json();
    assert(
      searchRes.status === 200 && searchData.customers.some((c) => c.company.includes('Tata')),
      'Search by keyword "Tata" returns matching customer'
    );

    // 7. Pagination
    const pageRes = await fetch(`${baseUrl}/customers?page=1&limit=2`, {
      headers: { Cookie: adminCookie },
    });
    const pageData = await pageRes.json();
    assert(
      pageRes.status === 200 && pageData.customers.length === 2 && pageData.pagination.totalPages >= 3,
      'Pagination handles page and limit correctly'
    );

    // 8. Update customer
    const updateRes = await fetch(`${baseUrl}/customers/${createdId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: execCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        company: 'Wipro Technologies Global',
      }),
    });
    const updateData = await updateRes.json();
    assert(
      updateRes.status === 200 && updateData.customer?.company === 'Wipro Technologies Global',
      'Updates customer details successfully'
    );

    // 9. Soft deactivate by SalesExecutive
    const deleteRes = await fetch(`${baseUrl}/customers/${createdId}`, {
      method: 'DELETE',
      headers: {
        Cookie: execCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    assert(deleteRes.status === 200, 'Deactivates customer successfully');

    // Clean up created customer
    await Customer.deleteOne({ _id: createdId });

    console.log(`\n========================================`);
    console.log(`Customers Tests Passed: ${passed} | Failed: ${failed}`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('Customer test error:', err);
    failed++;
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();

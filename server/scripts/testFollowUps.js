const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const FollowUp = require('../models/FollowUp');

const PORT = 5008;

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
    const adminListRes = await fetch(`${baseUrl}/followups`, { headers: { Cookie: adminCookie } });
    const adminListData = await adminListRes.json();
    assert(adminListRes.status === 200 && adminListData.pagination.total >= 6, 'Admin sees all follow-up activities');

    const managerListRes = await fetch(`${baseUrl}/followups`, { headers: { Cookie: managerCookie } });
    const managerListData = await managerListRes.json();
    assert(managerListRes.status === 200 && managerListData.pagination.total >= 4, 'Manager sees team follow-ups');

    const execListRes = await fetch(`${baseUrl}/followups`, { headers: { Cookie: execCookie } });
    const execListData = await execListRes.json();
    assert(execListRes.status === 200 && execListData.pagination.total >= 2, 'SalesExecutive sees assigned follow-ups');

    // 2. Business Rule: Date before today rejected with exact 400 message
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const pastDateRes = await fetch(`${baseUrl}/followups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: execCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        type: 'Call',
        title: 'Past date call attempt',
        dueDate: yesterday,
      }),
    });
    const pastDateData = await pastDateRes.json();
    assert(
      pastDateRes.status === 400 && pastDateData.message === 'Follow-up date cannot be earlier than today.',
      'Rejects past follow-up date with exact message "Follow-up date cannot be earlier than today."'
    );

    // 3. Valid follow-up creation
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const createRes = await fetch(`${baseUrl}/followups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: execCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        type: 'Call',
        title: 'Prospect Follow-Up Call',
        description: 'Verify receipt of proposal.',
        dueDate: tomorrow,
        priority: 'High',
      }),
    });
    const createData = await createRes.json();
    assert(
      createRes.status === 201 && createData.followUp?.status === 'Pending',
      'Creates follow-up activity with valid future date'
    );
    const followUpId = createData.followUp?.id;

    // 4. Reschedule follow-up
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const reschedRes = await fetch(`${baseUrl}/followups/${followUpId}/reschedule`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: execCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        dueDate: nextWeek,
        notes: 'Client requested reschedule to next week.',
      }),
    });
    const reschedData = await reschedRes.json();
    assert(
      reschedRes.status === 200 && Boolean(reschedData.followUp),
      'Reschedules follow-up with updated due date'
    );

    // 5. Complete follow-up
    const completeRes = await fetch(`${baseUrl}/followups/${followUpId}/complete`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: execCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        completedNotes: 'Client confirmed receipt and approved next steps.',
      }),
    });
    const completeData = await completeRes.json();
    assert(
      completeRes.status === 200 && completeData.followUp?.status === 'Completed' && Boolean(completeData.followUp?.completedAt),
      'Marks follow-up as Completed with timestamp and notes'
    );

    // 6. Filter by view=overdue
    const overdueRes = await fetch(`${baseUrl}/followups?view=overdue`, {
      headers: { Cookie: adminCookie },
    });
    const overdueData = await overdueRes.json();
    assert(
      overdueRes.status === 200 && overdueData.followUps.some((f) => f.title.includes('Overdue')),
      'Filters overdue pending activities correctly'
    );

    // Cleanup created follow-up
    await FollowUp.deleteOne({ _id: followUpId });

    console.log(`\n========================================`);
    console.log(`Follow-Up Tests Passed: ${passed} | Failed: ${failed}`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('Follow-up test error:', err);
    failed++;
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();

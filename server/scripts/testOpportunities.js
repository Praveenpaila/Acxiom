const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Opportunity = require('../models/Opportunity');

const PORT = 5009;

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

    const sampleCust = await Customer.findOne({ customerCode: 'CUST-1001' });

    // 1. Scoping tests
    const adminListRes = await fetch(`${baseUrl}/opportunities`, { headers: { Cookie: adminCookie } });
    const adminListData = await adminListRes.json();
    assert(adminListRes.status === 200 && adminListData.pagination.total >= 5, 'Admin sees all opportunities');

    const managerListRes = await fetch(`${baseUrl}/opportunities`, { headers: { Cookie: managerCookie } });
    const managerListData = await managerListRes.json();
    assert(managerListRes.status === 200 && managerListData.pagination.total >= 3, 'Manager sees team opportunities');

    const execListRes = await fetch(`${baseUrl}/opportunities`, { headers: { Cookie: execCookie } });
    const execListData = await execListRes.json();
    assert(execListRes.status === 200 && execListData.pagination.total >= 2, 'SalesExecutive sees assigned opportunities');

    // 2. Business rule: amount <= 0 -> "Opportunity Amount must be greater than 0."
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const badAmountRes = await fetch(`${baseUrl}/opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: execCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        name: 'Invalid Amount Deal',
        customerId: sampleCust.id,
        amount: 0,
        expectedCloseDate: futureDate,
        probability: 50,
      }),
    });
    const badAmountData = await badAmountRes.json();
    assert(
      badAmountRes.status === 400 && badAmountData.message === 'Opportunity Amount must be greater than 0.',
      'Rejects amount <= 0 with exact message "Opportunity Amount must be greater than 0."'
    );

    // 3. Business rule: probability outside 0-100 -> "Probability must be between 0 and 100."
    const badProbRes = await fetch(`${baseUrl}/opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: execCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        name: 'Invalid Probability Deal',
        customerId: sampleCust.id,
        amount: 500000,
        expectedCloseDate: futureDate,
        probability: 120, // outside 0-100
      }),
    });
    const badProbData = await badProbRes.json();
    assert(
      badProbRes.status === 400 && badProbData.message === 'Probability must be between 0 and 100.',
      'Rejects probability > 100 with exact message "Probability must be between 0 and 100."'
    );

    // 4. Business rule: Active opp close date in past -> "Expected Close Date cannot be in the past."
    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const badDateRes = await fetch(`${baseUrl}/opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: execCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        name: 'Past Date Deal',
        customerId: sampleCust.id,
        amount: 500000,
        stage: 'Qualification',
        expectedCloseDate: pastDate,
        probability: 30,
      }),
    });
    const badDateData = await badDateRes.json();
    assert(
      badDateRes.status === 400 && badDateData.message === 'Expected Close Date cannot be in the past.',
      'Rejects active close date in past with exact message "Expected Close Date cannot be in the past."'
    );

    // 5. Valid opportunity creation with weighted pipeline check
    const createRes = await fetch(`${baseUrl}/opportunities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: execCookie,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        name: 'Mahindra Logistics Automation Deal',
        customerId: sampleCust.id,
        amount: 2000000,
        stage: 'Proposal',
        probability: 50,
        expectedCloseDate: futureDate,
      }),
    });
    const createData = await createRes.json();
    assert(
      createRes.status === 201 &&
      createData.opportunity?.weightedAmount === 1000000, // 20,00,000 * 50% = 10,00,000
      'Creates opportunity and computes weightedAmount = amount * probability / 100'
    );
    const oppId = createData.opportunity.id;

    // 6. Pipeline report endpoint
    const pipelineRes = await fetch(`${baseUrl}/opportunities/pipeline`, {
      headers: { Cookie: adminCookie },
    });
    const pipelineData = await pipelineRes.json();
    assert(
      pipelineRes.status === 200 &&
      pipelineData.stats?.totalPipelineValue > 0 &&
      pipelineData.stats?.weightedPipelineValue > 0,
      'Pipeline stats endpoint computes total and weighted pipeline values'
    );

    // Cleanup created opportunity
    await Opportunity.deleteOne({ _id: oppId });

    console.log(`\n========================================`);
    console.log(`Opportunity Tests Passed: ${passed} | Failed: ${failed}`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('Opportunity test error:', err);
    failed++;
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
};

runTests();

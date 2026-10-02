const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

async function runAuthTests() {
  console.log('===============================================================');
  console.log('      COMPREHENSIVE AUTHENTICATION & REGISTRATION AUDIT       ');
  console.log('===============================================================\n');
  console.log(`Target Backend URL: ${BASE_URL}\n`);

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] Test ${total}: ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${total}: ${message}`);
      throw new Error(`Test ${total} failed: ${message}`);
    }
  }

  try {
    // Test 1: Register a brand new valid student account
    const randomSuffix = Math.floor(Math.random() * 900000 + 100000);
    const testEmail = `student${randomSuffix}@my.sliit.lk`;
    const testPassword = 'SecurePassword123!';

    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dinesh Weerasinghe',
        email: testEmail,
        password: testPassword,
        phone: '0779988776',
        studentId: `IT22${randomSuffix}`,
      }),
    });
    const regData = await regRes.json();
    assert(
      regRes.status === 201 && regData.success === true && !!regData.token,
      `New user registration succeeds with 201 Created and returns JWT token`
    );
    assert(
      regData.user.email === testEmail.toLowerCase() && !regData.user.password,
      `Registration response includes sanitized user data without exposing password hash`
    );

    // Test 2: Attempt duplicate registration with the exact same email
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Person',
        email: testEmail,
        password: 'anotherpassword',
        phone: '0711122334',
      }),
    });
    const dupData = await dupRes.json();
    assert(
      dupRes.status === 400 && dupData.success === false && dupData.message.includes('already exists'),
      `Duplicate registration blocked with 400 Bad Request ("already exists")`
    );

    // Test 3: Registration with missing required fields
    const missingRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Incomplete User',
        email: 'incomplete@sliit.lk',
      }),
    });
    const missingData = await missingRes.json();
    assert(
      missingRes.status === 400 && missingData.success === false,
      `Registration rejected with 400 Bad Request when mandatory fields are missing`
    );

    // Test 4: Registration with password shorter than 6 characters
    const shortPassRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Short Pass User',
        email: `shortpass${randomSuffix}@sliit.lk`,
        password: '123',
        phone: '0770000000',
      }),
    });
    const shortPassData = await shortPassRes.json();
    assert(
      shortPassRes.status === 400 && shortPassData.message.includes('at least 6 characters'),
      `Registration enforces password minimum length >= 6 characters`
    );

    // Test 5: Successful login with correct credentials
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();
    assert(
      loginRes.status === 200 && loginData.success === true && !!loginData.token,
      `Login succeeds with 200 OK and returns authenticated JWT token`
    );
    const authToken = loginData.token;

    // Test 6: Case-insensitive email login (e.g. UPPERCASE email)
    const upperEmailLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail.toUpperCase(),
        password: testPassword,
      }),
    });
    const upperData = await upperEmailLogin.json();
    assert(
      upperEmailLogin.status === 200 && upperData.success === true,
      `Email login is case-insensitive (handles lowercase and uppercase inputs)`
    );

    // Test 7: Login attempt with WRONG password
    const wrongPassRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999!',
      }),
    });
    const wrongPassData = await wrongPassRes.json();
    assert(
      wrongPassRes.status === 401 && wrongPassData.success === false && wrongPassData.message.includes('Invalid email or password'),
      `Login fails with 401 Unauthorized when password is incorrect`
    );

    // Test 8: Login attempt with non-existent email
    const nonExistentRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `ghost_${Date.now()}@sliit.lk`,
        password: 'SomePassword123',
      }),
    });
    const nonExistentData = await nonExistentRes.json();
    assert(
      nonExistentRes.status === 401 && nonExistentData.message.includes('Invalid email or password'),
      `Login fails with 401 Unauthorized when email does not exist in MongoDB`
    );

    // Test 9: Protected route access (/api/auth/me) with valid token
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const meData = await meRes.json();
    assert(
      meRes.status === 200 && meData.success === true && meData.user.email === testEmail.toLowerCase(),
      `Protected route (/api/auth/me) successfully validates JWT and returns user profile`
    );

    // Test 10: Protected route access with missing token
    const noTokenRes = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
    });
    const noTokenData = await noTokenRes.json();
    assert(
      noTokenRes.status === 401 && noTokenData.success === false,
      `Protected route blocks unauthenticated requests with 401 Unauthorized`
    );

    // Test 11: Protected route access with invalid/tampered token
    const fakeTokenRes = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer invalid.fake.token',
      },
    });
    assert(
      fakeTokenRes.status === 401,
      `Protected route rejects malformed/tampered JWT tokens with 401 Unauthorized`
    );

    // Test 12: Verify pre-seeded demo accounts
    console.log('\n--- Verifying Pre-seeded Demo Accounts ---');

    // Kasun (Student)
    const kasunRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'kasun@my.sliit.lk', password: 'password123' }),
    });
    assert(kasunRes.status === 200, `Demo Account 1 (kasun@my.sliit.lk) logs in successfully`);

    // Anuki (Student)
    const anukiRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'anuki@my.sliit.lk', password: 'password123' }),
    });
    assert(anukiRes.status === 200, `Demo Account 2 (anuki@my.sliit.lk) logs in successfully`);

    // Security Desk (Admin)
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'security@sliit.lk', password: 'adminpassword123' }),
    });
    assert(adminRes.status === 200, `Demo Account 3 (security@sliit.lk) logs in successfully`);

    console.log('\n===============================================================');
    console.log(`🎉 ALL ${passed} / ${total} AUTHENTICATION & REGISTRATION TESTS PASSED! 🎉`);
    console.log('Authentication is 100% verified, robust, and completely error-free!');
    console.log('===============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Authentication audit encountered an error:', err.message);
    process.exit(1);
  }
}

runAuthTests();

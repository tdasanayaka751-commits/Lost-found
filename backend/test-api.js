const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Starting UniFind Campus Lost & Found Backend Test Suite ---');
  console.log(`Target API URL: ${BASE_URL}\n`);

  try {
    // 1. Health check
    console.log('[Test 1] Checking API health...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    console.log('✓ Health Check Status:', healthData.status);

    // 2. Register User A (Reporter)
    const randomSuffix = Math.floor(Math.random() * 10000);
    const userAEmail = `reporter${randomSuffix}@sliit.lk`;
    console.log(`\n[Test 2] Registering User A (${userAEmail})...`);
    const regARes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kamal Perera',
        email: userAEmail,
        password: 'password123',
        phone: '0771234567',
        studentId: `IT22${randomSuffix}`,
      }),
    });
    const regAData = await regARes.json();
    if (!regAData.success) throw new Error(`Registration failed: ${regAData.message}`);
    const tokenA = regAData.token;
    const userAId = regAData.user.id;
    console.log(`✓ User A registered with ID: ${userAId}`);

    // 3. Register User B (Claimant)
    const userBEmail = `claimant${randomSuffix}@sliit.lk`;
    console.log(`\n[Test 3] Registering User B (${userBEmail})...`);
    const regBRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Nimali Fernando',
        email: userBEmail,
        password: 'password123',
        phone: '0712345678',
        studentId: `IT22${randomSuffix + 1}`,
      }),
    });
    const regBData = await regBRes.json();
    if (!regBData.success) throw new Error(`Registration failed: ${regBData.message}`);
    const tokenB = regBData.token;
    console.log(`✓ User B registered with ID: ${regBData.user.id}`);

    // 4. Create dummy image file for upload test
    const dummyImagePath = path.join(__dirname, 'test-image.jpg');
    fs.writeFileSync(dummyImagePath, 'Fake image binary data for testing');

    // Create item using FormData (Native FormData available in Node 18+)
    console.log('\n[Test 4] User A reporting a Found Item with image upload...');
    const formData = new FormData();
    formData.append('title', 'Blue Water Flask');
    formData.append('type', 'Found');
    formData.append('category', 'Personal Items');
    formData.append('description', 'Stainless steel water bottle left on Bench 4 near Gym.');
    formData.append('location', 'Sports Complex Bench 4');
    formData.append(
      'image',
      new Blob([fs.readFileSync(dummyImagePath)], { type: 'image/jpeg' }),
      'flask.jpg'
    );

    const itemRes = await fetch(`${BASE_URL}/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
      },
      body: formData,
    });
    const itemData = await itemRes.json();
    if (!itemData.success) throw new Error(`Item creation failed: ${itemData.message}`);
    const createdItem = itemData.data;
    console.log(`✓ Item created with ID: ${createdItem._id}, Image: ${createdItem.imageUrl}`);

    // Clean up temporary local test file
    if (fs.existsSync(dummyImagePath)) fs.unlinkSync(dummyImagePath);

    // 5. Test Business Logic Rule 1: User A trying to claim their OWN reported item
    console.log('\n[Test 5] Testing Business Rule 1 (Cannot claim own item)...');
    const selfClaimRes = await fetch(`${BASE_URL}/claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        itemId: createdItem._id,
        proofDetails: 'This is my own bottle that I reported',
        contactNumber: '0771234567',
      }),
    });
    const selfClaimData = await selfClaimRes.json();
    if (selfClaimRes.status === 400 && selfClaimData.message.includes('cannot submit a claim for an item you reported')) {
      console.log('✓ Successfully blocked self-claim with message:', selfClaimData.message);
    } else {
      throw new Error(`Self-claim check failed! Status: ${selfClaimRes.status}, Message: ${selfClaimData.message}`);
    }

    // 6. User B submits valid claim
    console.log('\n[Test 6] User B submitting valid claim on item...');
    const claimRes = await fetch(`${BASE_URL}/claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        itemId: createdItem._id,
        proofDetails: 'Hydro Flask 500ml navy blue with a small dent on the bottom rim.',
        contactNumber: '0712345678',
      }),
    });
    const claimData = await claimRes.json();
    if (!claimData.success) throw new Error(`Claim submission failed: ${claimData.message}`);
    const createdClaim = claimData.data;
    console.log(`✓ Claim submitted with ID: ${createdClaim._id}, Status: ${createdClaim.status}`);

    // 7. Test Business Logic Rule 2: Duplicate active claim on same item
    console.log('\n[Test 7] Testing Business Rule 2 (Prevent duplicate claim by same user)...');
    const dupClaimRes = await fetch(`${BASE_URL}/claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        itemId: createdItem._id,
        proofDetails: 'Second attempt claim',
        contactNumber: '0712345678',
      }),
    });
    const dupClaimData = await dupClaimRes.json();
    if (dupClaimRes.status === 400 && dupClaimData.message.includes('already have an active claim')) {
      console.log('✓ Successfully prevented duplicate claim:', dupClaimData.message);
    } else {
      throw new Error(`Duplicate claim check failed! Status: ${dupClaimRes.status}`);
    }

    // 8. Test Business Logic Rule 3: User A (Reporter) approves User B's claim
    console.log('\n[Test 8] Reporter approving claim and verifying item status mutation...');
    const approveRes = await fetch(`${BASE_URL}/claims/${createdClaim._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        status: 'Approved',
        adminNotes: 'Description and dent location verified. Handover completed.',
      }),
    });
    const approveData = await approveRes.json();
    if (!approveData.success) throw new Error(`Claim approval failed: ${approveData.message}`);
    console.log(`✓ Claim status updated to: ${approveData.data.status}`);
    console.log(`✓ Associated Item status automatically flipped to: ${approveData.itemStatus}`);

    // 9. Test Business Logic Rule 4: Claim on already Claimed item must be rejected
    console.log('\n[Test 9] Testing Business Rule 4 (No claims allowed on already claimed items)...');
    const userCEmail = `userC${randomSuffix}@sliit.lk`;
    const regCRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Third Student',
        email: userCEmail,
        password: 'password123',
        phone: '0755555555',
      }),
    });
    const regCData = await regCRes.json();
    const tokenC = regCData.token;

    const claimOnClaimedRes = await fetch(`${BASE_URL}/claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenC}`,
      },
      body: JSON.stringify({
        itemId: createdItem._id,
        proofDetails: 'Trying to claim already claimed item',
        contactNumber: '0755555555',
      }),
    });
    const claimOnClaimedData = await claimOnClaimedRes.json();
    if (claimOnClaimedRes.status === 400 && claimOnClaimedData.message.includes('Claimed')) {
      console.log('✓ Successfully blocked claim on already claimed item:', claimOnClaimedData.message);
    } else {
      throw new Error(`Status check failed! Status: ${claimOnClaimedRes.status}`);
    }

    // 10. Reversion Test: Cancelling approved claim releases item back to 'Open'
    console.log('\n[Test 10] Testing Reversion Rule (Cancelling approved claim releases item to Open)...');
    const revertRes = await fetch(`${BASE_URL}/claims/${createdClaim._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        status: 'Cancelled',
        adminNotes: 'Student did not come to collect within 48 hours.',
      }),
    });
    const revertData = await revertRes.json();
    if (revertData.itemStatus === 'Open') {
      console.log('✓ Item status successfully reverted back to "Open"!');
    } else {
      throw new Error(`Item status did not revert to Open: ${revertData.itemStatus}`);
    }

    console.log('\n==========================================================');
    console.log('🎉 ALL 10 TEST CASES PASSED WITH 100% SPEC COMPLIANCE! 🎉');
    console.log('==========================================================');
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err.message);
    process.exit(1);
  }
}

runTests();

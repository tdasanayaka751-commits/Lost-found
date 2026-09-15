const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const User = require('./src/models/User');
const Item = require('./src/models/Item');
const Claim = require('./src/models/Claim');

dotenv.config();

// Ensure uploads folder and placeholder files exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create a simple SVG or base64 placeholder image if not present
const createSampleImage = (filename, label, bgColor = '#2563eb') => {
  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) {
    // Generate simple SVG image
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <rect width="600" height="400" fill="${bgColor}"/>
      <circle cx="300" cy="180" r="60" fill="white" opacity="0.2"/>
      <text x="300" y="190" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">UniFind Campus</text>
      <text x="300" y="235" font-family="Arial, sans-serif" font-size="22" fill="#f8fafc" text-anchor="middle">${label}</text>
    </svg>`;
    fs.writeFileSync(filePath, svg, 'utf8');
  }
  return `/uploads/${filename}`;
};

const seedData = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/unifind_lost_and_found';
    await mongoose.connect(mongoURI);
    console.log('[Seed] Connected to database.');

    // Clear existing data
    await Claim.deleteMany({});
    await Item.deleteMany({});
    await User.deleteMany({});
    console.log('[Seed] Cleared existing Users, Items, and Claims.');

    // Create Sample Users
    const kasun = await User.create({
      name: 'Kasun Perera',
      email: 'kasun@my.sliit.lk',
      password: 'password123',
      phone: '0771234567',
      studentId: 'IT22001122',
      role: 'user',
    });

    const anuki = await User.create({
      name: 'Anuki Silva',
      email: 'anuki@my.sliit.lk',
      password: 'password123',
      phone: '0719876543',
      studentId: 'IT22003344',
      role: 'user',
    });

    const admin = await User.create({
      name: 'SLIIT Security Desk',
      email: 'security@sliit.lk',
      password: 'adminpassword123',
      phone: '0117544801',
      studentId: 'STAFF001',
      role: 'admin',
    });

    console.log('[Seed] Created 3 Users (Kasun, Anuki, Admin).');

    // Sample Images
    const img1 = createSampleImage('id-card.svg', 'SLIIT Student ID Card', '#1e3a8a');
    const img2 = createSampleImage('calculator.svg', 'Casio fx-991EX Calculator', '#0f766e');
    const img3 = createSampleImage('airpods.svg', 'Apple AirPods Case', '#374151');
    const img4 = createSampleImage('umbrella.svg', 'Navy Blue Umbrella', '#0369a1');

    // Create Sample Items
    const item1 = await Item.create({
      title: 'SLIIT Student ID Card (IT22******)',
      type: 'Found',
      category: 'ID & Cards',
      description: 'Found a student identification card near the 3rd floor quiet study area in the Main Library. Please provide full name and ID number to claim.',
      location: 'Main Library 3rd Floor',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      imageUrl: img1,
      status: 'Open',
      reportedBy: kasun._id,
    });

    const item2 = await Item.create({
      title: 'Casio fx-991EX ClassWiz Calculator',
      type: 'Lost',
      category: 'Electronics',
      description: 'Lost my scientific calculator during SE2020 lecture in Block B Hall 401. Has a small sticker with a robot on the battery cover.',
      location: 'Block B - Hall 401',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      imageUrl: img2,
      status: 'Open',
      reportedBy: anuki._id,
    });

    const item3 = await Item.create({
      title: 'AirPods Pro 2nd Gen in Black Protective Case',
      type: 'Found',
      category: 'Electronics',
      description: 'Found white AirPods inside a matte black silicone sleeve on desk #14 in Computing Lab 03.',
      location: 'Computing Lab 03',
      date: new Date(),
      imageUrl: img3,
      status: 'Open',
      reportedBy: admin._id,
    });

    const item4 = await Item.create({
      title: 'Navy Blue Foldable Umbrella with Wooden Handle',
      type: 'Found',
      category: 'Other',
      description: 'Left behind on a table in the Main Student Cafeteria after the heavy rain yesterday afternoon.',
      location: 'Main Canteen Ground Floor',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      imageUrl: img4,
      status: 'Claimed',
      reportedBy: kasun._id,
    });

    console.log('[Seed] Created 4 Items (ID Card, Calculator, AirPods, Umbrella).');

    // Create a Claim
    const claim1 = await Claim.create({
      itemId: item1._id,
      claimant: anuki._id,
      proofDetails: 'My name is Anuki Silva, student ID IT22003344. The photo matches my student portal profile and has my faculty sticker on the reverse side.',
      contactNumber: '0719876543',
      status: 'Pending',
    });

    const claim2 = await Claim.create({
      itemId: item4._id,
      claimant: anuki._id,
      proofDetails: 'Navy umbrella bought from Miniso, wooden handle has slight scratch near the hanging cord.',
      contactNumber: '0719876543',
      status: 'Approved',
      adminNotes: 'Handed over at Security Desk after student matched the description.',
      resolvedAt: new Date(),
    });

    console.log('[Seed] Created sample Claims (1 Pending, 1 Approved).');
    console.log('\n================ SEED SUMMARY ================');
    console.log('User Accounts:');
    console.log('1. kasun@my.sliit.lk / password123 (Student)');
    console.log('2. anuki@my.sliit.lk / password123 (Student)');
    console.log('3. security@sliit.lk / adminpassword123 (Admin)');
    console.log('===============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedData();

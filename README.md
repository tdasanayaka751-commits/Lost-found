# UniFind — Campus Lost & Found Mobile Application

> **SLIIT — Faculty of Computing**  
> **SE2020: Web and Mobile Technologies — Individual Assignment**  
> **Tech Stack:** React Native (Expo) • Node.js + Express.js • MongoDB Atlas • JWT • Multer

---

## 1. Project Overview

**UniFind** is a full-stack campus lost-and-found mobile system designed for university students and campus security staff. When students misplace valuable items (student ID cards, calculators, chargers, keys, earphones) or find unattended belongings on campus, UniFind provides a centralized, authenticated platform with photo uploads, search and filter features, and a secure ownership verification workflow.

### Entity Relationship Model
- **Primary Entity:** `Item` (Lost / Found reports with photo upload via Multer, category, location, date, and status: Open, Claimed, Resolved).
- **Related Entity:** `Claim` (Ownership verification claims referencing the Item, with proof details, claimant contact, and status transitions: Pending, Approved, Rejected, Cancelled).
- **Authentication:** `User` (Bcrypt-hashed passwords, JWT tokens, protected routes on backend and protected areas in the mobile app).

### Real Business Logic Implemented
1. **Self-Claim Restriction:** A student cannot submit a claim for an item they reported themselves (`reportedBy === claimant` is blocked with HTTP 400).
2. **Item Availability Gate:** Claims can only be filed against items whose status is `'Open'`. If an item is already `'Claimed'` or `'Resolved'`, new claim submissions are rejected.
3. **Duplicate Prevention:** A student cannot submit multiple active or pending claims for the same item.
4. **Approval State Mutation & Cascading Resolution:** When an item reporter or security admin approves a claim:
   - The claim status flips to `'Approved'`.
   - The referenced item's status automatically flips to `'Claimed'`.
   - All other pending claims for that same item are automatically flipped to `'Rejected'` with reason *"Another claim for this item was verified and approved."*
5. **Reversion Rule:** If an approved claim is subsequently cancelled or rejected (e.g. claimant fails to show up), the item status is automatically released back to `'Open'`.

---

## 2. Repository Structure

```
WMTRR/
├── backend/                      # Node.js + Express REST API
│   ├── src/
│   │   ├── config/db.js          # MongoDB connection helper
│   │   ├── controllers/          # Business logic controllers
│   │   │   ├── authController.js
│   │   │   ├── itemController.js
│   │   │   └── claimController.js
│   │   ├── middleware/           # Auth, Multer, Error handlers
│   │   │   ├── authMiddleware.js
│   │   │   ├── uploadMiddleware.js
│   │   │   └── errorMiddleware.js
│   │   ├── models/               # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Item.js
│   │   │   └── Claim.js
│   │   └── routes/               # RESTful route definitions
│   │       ├── authRoutes.js
│   │       ├── itemRoutes.js
│   │       └── claimRoutes.js
│   ├── uploads/                  # Uploaded item images storage
│   ├── .env.example              # Environment variables template
│   ├── package.json
│   ├── seed.js                   # Pre-populates sample campus data
│   ├── server.js                 # Server entry point
│   └── test-api.js               # Automated 10-point test suite
│
├── mobile/                       # React Native (Expo) Mobile App
│   ├── src/
│   │   ├── api/                  # API client with JWT interceptor & config
│   │   ├── components/           # Reusable UI components
│   │   │   ├── CustomButton.js
│   │   │   ├── CustomInput.js
│   │   │   ├── ItemCard.js
│   │   │   ├── StatusBadge.js
│   │   │   └── EmptyState.js
│   │   ├── constants/theme.js    # Colors, categories, badges
│   │   ├── context/AuthContext.js# User session and token management
│   │   ├── navigation/           # Stack and Bottom Tab navigators
│   │   └── screens/
│   │       ├── Auth/             # Login & Register
│   │       ├── Items/            # Explore Feed, Detail, Report, Edit
│   │       ├── Claims/           # Submit Claim, Review Claims
│   │       ├── Activity/         # My Reported Items & My Claims tabs
│   │       └── Profile/          # User info & Live API Switcher
│   ├── App.js
│   ├── app.json
│   └── package.json
│
├── REPORT_AND_VIVA_GUIDE.md      # Comprehensive 8-12 page equivalent academic report & viva guide
└── README.md                     # Quickstart documentation
```

---

## 3. Quick Start Guide

### Step 1: Run the Backend API
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `.env` (a ready-to-run `.env` is included, or copy from `.env.example`):
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/unifind_lost_and_found
   JWT_SECRET=unifind_campus_lost_and_found_secret_sliit_2026
   JWT_EXPIRE=30d
   ```
4. Seed the database with sample campus data:
   ```bash
   npm run seed
   ```
5. Start the backend server:
   ```bash
   npm run dev   # or npm start
   ```
6. Run the automated test suite to verify all 10 endpoints & business rules:
   ```bash
   npm run test:api
   ```

### Step 2: Run the Mobile Application
1. Open a new terminal and navigate to the mobile folder:
   ```bash
   cd mobile
   ```
2. Start the Expo development server:
   ```bash
   npx expo start
   ```
3. Choose your testing environment:
   - **Web Browser:** Press `w` in terminal to launch in web browser.
   - **Android Emulator:** Press `a` (Make sure backend URL is `http://10.0.2.2:5000/api`).
   - **Physical Device:** Install the **Expo Go** app on your phone, scan the QR code in the terminal, and set the API URL in the app's Profile screen to your computer's local Wi-Fi IP (e.g. `http://192.168.1.100:5000/api`).

---

## 4. Pre-configured Demo Accounts

| Account Role | Email Address | Password | Description |
| :--- | :--- | :--- | :--- |
| **Student (Reporter)** | `kasun@my.sliit.lk` | `password123` | Reported ID Card & Umbrella |
| **Student (Claimant)** | `anuki@my.sliit.lk` | `password123` | Reported Calculator & Claimed ID Card |
| **Campus Security** | `security@sliit.lk` | `adminpassword123` | Campus security desk administrator |

*(The Login screen includes one-tap quick-fill buttons for instant evaluation during viva demonstrations.)*

---

## 5. Environment Variables (.env) Reference

| Variable Name | Required | Default / Description |
| :--- | :--- | :--- |
| `PORT` | Yes | `5000` — Port on which Express listens |
| `NODE_ENV` | Yes | `development` or `production` |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string `mongodb+srv://...` |
| `JWT_SECRET` | Yes | Cryptographic secret for signing JWT tokens |
| `JWT_EXPIRE` | Yes | Expiration duration (e.g., `30d`) |

---

## 6. RESTful API Endpoint Table

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | No | Server health check endpoint |
| `POST` | `/api/auth/register` | No | Register new student account |
| `POST` | `/api/auth/login` | No | Login and obtain JWT token |
| `GET` | `/api/auth/me` | Yes | Get authenticated user profile |
| `GET` | `/api/items` | No | List items with search, type, category, status filters |
| `GET` | `/api/items/:id` | No | Get single item details and claim count |
| `POST` | `/api/items` | Yes | Create item with Multer multipart image upload |
| `PUT` | `/api/items/:id` | Yes | Update item details / replace image |
| `DELETE` | `/api/items/:id` | Yes | Delete item and cascade delete associated claims |
| `GET` | `/api/items/user/my-items`| Yes | Get items reported by current user |
| `POST` | `/api/claims` | Yes | Submit claim on item (enforces business logic) |
| `GET` | `/api/claims/my-claims` | Yes | Get claims submitted by current user |
| `GET` | `/api/claims/item/:itemId`| Yes | Get all claims received for an item (reporter/admin) |
| `GET` | `/api/claims/:id` | Yes | Get single claim details |
| `PUT` | `/api/claims/:id` | Yes | Update pending claim proof details |
| `PATCH`| `/api/claims/:id/status` | Yes | Approve / Reject / Cancel claim (mutates item status) |
| `DELETE`| `/api/claims/:id` | Yes | Withdraw / delete claim |

---

## 7. Deployment Walkthrough (Render + MongoDB Atlas)

### Step 1: MongoDB Atlas
1. Create a free cluster on [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a Database User (e.g. `unifind_user` with strong password).
3. In **Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere).
4. Click **Connect -> Drivers** and copy connection string:
   `mongodb+srv://<username>:<password>@cluster0.mongodb.net/unifind?retryWrites=true&w=majority`

### Step 2: Render.com Backend Hosting
1. Push this repository to GitHub.
2. Log into [Render](https://render.com/) and click **New -> Web Service**.
3. Connect your repository and configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. In **Environment Variables**, add:
   - `MONGODB_URI`: `<Your MongoDB Atlas connection string>`
   - `JWT_SECRET`: `<Your production secret>`
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
5. Click **Deploy**. Note your live URL: `https://<service-name>.onrender.com`.

### Step 3: Connect Mobile App to Live Backend
Open the mobile app -> go to **Profile** tab -> enter your live URL (e.g. `https://<service-name>.onrender.com/api`) and tap **Save Server URL**. The mobile app will now fetch and upload directly to your deployed backend!

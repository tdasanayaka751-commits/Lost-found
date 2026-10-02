# UniFind: Campus Lost & Found System
## SE2020 — Web and Mobile Technologies Individual Assignment Report & Viva Defense Guide

**Student Name:** [Your Name]  
**Student ID:** [Your Student ID / IT Number]  
**Faculty:** Faculty of Computing, SLIIT  
**Degree Programme:** BSc (Hons) in Software Engineering — Year 2 Semester 2  
**Module:** SE2020 – Web and Mobile Technologies  
**Selected Topic:** Campus Lost & Found (Item + Claim)  

---

# Table of Contents
1. [Section 1: Problem Statement](#section-1-problem-statement)
2. [Section 2: System Architecture Diagram & Description](#section-2-system-architecture-diagram--description)
3. [Section 3: Database Schema & Entity-Relationship (ER) Diagram](#section-3-database-schema--entity-relationship-er-diagram)
4. [Section 4: RESTful API Endpoint Table](#section-4-restful-api-endpoint-table)
5. [Section 5: Core Business Logic & State Transition Lifecycle](#section-5-core-business-logic--state-transition-lifecycle)
6. [Section 6: Deployment Walkthrough (Render + MongoDB Atlas)](#section-6-deployment-walkthrough-render--mongodb-atlas)
7. [Section 7: One-Page Reflection — What Broke and How We Fixed It](#section-7-one-page-reflection--what-broke-and-how-we-fixed-it)
8. [Section 8: Comprehensive Viva Defense Master Guide (60 Marks)](#section-8-comprehensive-viva-defense-master-guide-60-marks)

---

# Section 1: Problem Statement

In large university environments like the SLIIT Malabe campus, thousands of students, academic lecturers, and non-academic staff traverse multiple faculty buildings, lecture halls, computer laboratories, libraries, and cafeterias every single day. Due to high physical mobility and tightly packed academic schedules, personal belongings are frequently misplaced or forgotten. Common items include:
- Government and Student Identification Cards (IDs)
- Scientific calculators (Casio fx-991EX)
- Laptop chargers and adapters
- Wireless earbuds and mobile devices
- Course notes, flash drives, umbrella, and water bottles

### The Current Flawed Process
Currently, lost items on campus are managed through informal, disorganized, and fragmented channels:
1. **Unmoderated Social Media & WhatsApp Groups:** Announcements get buried within minutes under hundreds of chat messages, making searching impossible.
2. **Physical Security Counters:** Items handed into the ground floor security desks or faculty offices are kept in cardboard boxes without searchable digital records. Students have to walk to multiple security desks across campus just to ask whether an item was found.
3. **No Ownership Verification:** Informal channels lack a structured mechanism to verify whether the student claiming an item is the legitimate owner, creating a high risk of fraudulent pickups.

### The UniFind Solution
UniFind bridges this gap by providing an end-to-end mobile system built on **React Native**, backed by an **Express.js / Node.js** RESTful API and a cloud-hosted **MongoDB Atlas** database.
UniFind enforces:
- Structured listing categorization (`Lost` vs `Found`, category, campus building, photo).
- Image uploads so finders can present visual verification.
- A two-entity system (`Item` and `Claim`) where students submit formal ownership claims with identifying proof.
- Robust business logic that automates status transitions and prevents fraudulent or duplicate claims.

---

# Section 2: System Architecture Diagram & Description

UniFind adheres to the classic **Client-Server Architecture** utilizing a layered **Model-View-Controller (MVC)** design pattern on the backend, paired with a component-driven, state-managed React Native client.

### Architectural Diagram

```
+-----------------------------------------------------------------------------------+
|                            MOBILE CLIENT (React Native)                            |
|                                                                                   |
|   +-------------------+  +--------------------+  +----------------------------+   |
|   |   Presentation    |  |     Navigation     |  |       State & Context      |   |
|   | Screens & Badges  |  | Stack + Bottom Tabs|  |  AuthContext + AsyncStorage|   |
|   +---------+---------+  +---------+----------+  +-------------+--------------+   |
|             |                      |                           |                  |
|             +----------------------+---------------------------+                  |
|                                    |                                              |
|                    apiClient (Fetch + JWT Interceptor)                            |
+------------------------------------+----------------------------------------------+
                                     |
                          HTTPS / REST API Requests
                     (JSON Body / Multipart Form-Data)
                                     |
+------------------------------------+----------------------------------------------+
|                         BACKEND REST API (Express.js)                             |
|                                                                                   |
|  [ Middleware Pipeline ]                                                          |
|  CORS -> Express JSON Parser -> Morgan Logger -> Upload (Multer) -> Auth (JWT)    |
|                                    |                                              |
|  [ REST Routes ]                   v                                              |
|  /api/auth/*     ---------> authController.js                                    |
|  /api/items/*    ---------> itemController.js                                    |
|  /api/claims/*   ---------> claimController.js (Enforces Business Rules)          |
|                                    |                                              |
|  [ File Storage ]                  v                                              |
|  /uploads/ <====== (Multer saves local disk image, serves statically via HTTP)    |
|                                    |                                              |
|  [ Data Access Layer ]             v                                              |
|  Mongoose ODM (Schema validation, pre-save password hash hooks, indexes)          |
+------------------------------------+----------------------------------------------+
                                     |
                                TCP / TLS
                                     |
+------------------------------------+----------------------------------------------+
|                         DATABASE (MongoDB Atlas)                                  |
|                                                                                   |
|   Collections:                                                                    |
|   1. `users`   (Authentication, hashed passwords, roles)                          |
|   2. `items`   (Primary entity: Title, category, photo URL, location, status)     |
|   3. `claims`  (Related entity: References itemId & claimant, proof, status)      |
+-----------------------------------------------------------------------------------+
```

### Key Architectural Characteristics
- **Separation of Concerns:** Route handlers only parse routing logic; business logic and database queries reside inside isolated controllers; database schemas and validation constraints reside in dedicated Mongoose models.
- **Stateless Authentication:** User state is not held in server memory. Instead, clients transmit a signed **JSON Web Token (JWT)** in the `Authorization: Bearer <token>` header with every protected request.
- **Multipart Data Handling:** Multer middleware intercepts file uploads (`multipart/form-data`), checks MIME types and size limits, writes the file to the `/uploads` directory, and attaches the resulting URL to `req.body.imageUrl`.

---

# Section 3: Database Schema & Entity-Relationship (ER) Diagram

UniFind strictly adheres to the module brief's boundary of **two entities** beyond `User`:
1. **Primary Entity:** `Item`
2. **Related Entity:** `Claim` (references `Item` and `User`)

### Entity-Relationship Diagram

```
+-----------------------------------+             +-----------------------------------+
|               User                |             |               Item                |
+-----------------------------------+             +-----------------------------------+
| _id: ObjectId [PK]                | 1         * | _id: ObjectId [PK]                |
| name: String                      |<------------| reportedBy: ObjectId [FK -> User] |
| email: String [Unique]            |             | title: String                     |
| password: String [Hashed]         |             | type: 'Lost' | 'Found'            |
| phone: String                     |             | category: String                  |
| studentId: String                 |             | description: String               |
| role: 'user' | 'admin'            |             | location: String                  |
| createdAt: Date                   |             | date: Date                        |
| updatedAt: Date                   |             | imageUrl: String                  |
+-----------------------------------+             | status: 'Open'|'Claimed'|'Resolved'
                  ^                               | createdAt: Date                   |
                  |                               | updatedAt: Date                   |
                  | 1                             +-----------------------------------+
                  |                                                 ^
                  |                                                 | 1
                  |                                                 |
                  | *                             *                 |
+-----------------+-------------------------------------------------+
|                                 Claim                               |
+---------------------------------------------------------------------+
| _id: ObjectId [PK]                                                  |
| itemId: ObjectId [FK -> Item]                                       |
| claimant: ObjectId [FK -> User]                                     |
| proofDetails: String                                                |
| contactNumber: String                                               |
| status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'           |
| adminNotes: String                                                  |
| resolvedAt: Date                                                    |
| createdAt: Date                                                     |
| updatedAt: Date                                                     |
+---------------------------------------------------------------------+
```

### Schema Definitions & Indexing Strategy
- **`Item` Collection:**
  - `compound index`: `{ type: 1, status: 1, category: 1 }` allows the home screen filter bar to execute ultra-fast, zero-scan queries across thousands of campus items.
  - `text index`: `{ title: 'text', description: 'text', location: 'text' }` provides keyword search across item titles, locations, and descriptions.
- **`Claim` Collection:**
  - `compound index`: `{ itemId: 1, claimant: 1, status: 1 }` enables instant O(1) checks for existing active claims when a student submits an ownership claim.

---

# Section 4: RESTful API Endpoint Table

| # | HTTP Method | Endpoint | Auth Required | Purpose / Request Body | Response Codes |
|---|---|---|:---:|---|---|
| 1 | `GET` | `/api/health` | No | Server heartbeat check | `200` |
| 2 | `POST` | `/api/auth/register` | No | `{ name, email, password, phone, studentId }` | `201`, `400` |
| 3 | `POST` | `/api/auth/login` | No | `{ email, password }` | `200`, `400`, `401` |
| 4 | `GET` | `/api/auth/me` | Yes | Get authenticated profile | `200`, `401` |
| 5 | `GET` | `/api/items` | No | List items with query filters (`?type=&category=&status=&search=`) | `200` |
| 6 | `GET` | `/api/items/:id` | No | Get single item by ID, with populated reporter details & claim count | `200`, `404` |
| 7 | `POST` | `/api/items` | Yes | Create item with `multipart/form-data` (`image`, `title`, `type`, `category`, `description`, `location`) | `201`, `400`, `401` |
| 8 | `PUT` | `/api/items/:id` | Yes | Update item details / replace image (reporter or admin only) | `200`, `400`, `403`, `404` |
| 9 | `DELETE` | `/api/items/:id` | Yes | Delete item and cascade delete associated claims | `200`, `403`, `404` |
| 10 | `GET` | `/api/items/user/my-items` | Yes | List items reported by authenticated student | `200`, `401` |
| 11 | `POST` | `/api/claims` | Yes | Submit claim `{ itemId, proofDetails, contactNumber }` (enforces business rules) | `201`, `400`, `404` |
| 12 | `GET` | `/api/claims/my-claims` | Yes | List claims submitted by authenticated student | `200`, `401` |
| 13 | `GET` | `/api/claims/item/:itemId` | Yes | List claims received for an item (reporter or admin only) | `200`, `403`, `404` |
| 14 | `GET` | `/api/claims/:id` | Yes | Get single claim by ID (claimant, reporter, or admin) | `200`, `403`, `404` |
| 15 | `PUT` | `/api/claims/:id` | Yes | Update pending claim proof details `{ proofDetails, contactNumber }` | `200`, `400`, `403`, `404` |
| 16 | `PATCH` | `/api/claims/:id/status` | Yes | Update status `{ status: 'Approved'|'Rejected'|'Cancelled', adminNotes }` | `200`, `400`, `403`, `404` |
| 17 | `DELETE` | `/api/claims/:id` | Yes | Withdraw claim (if approved, releases item back to 'Open') | `200`, `403`, `404` |

---

# Section 5: Core Business Logic & State Transition Lifecycle

The assignment brief specifically highlights:  
> *"At least one piece of real business logic — a rule the database cannot enforce on its own, such as blocking a booking when capacity is full, or recalculating a total when an item changes."*

UniFind implements an interconnected state machine that strictly enforces five rules:

```
               [Student Posts Item]
                        │
                        ▼
               Item Status: 'Open'
                        │
       ┌────────────────┴────────────────┐
       ▼                                 ▼
[Student Claims Item]           [Claimant is Finder?]
(Status: 'Pending')             ├── Yes ──> ❌ Blocked (HTTP 400)
       │                        └── No  ──> ✅ Created
       ▼
[Reporter Reviews Claims]
       ├── Reject Claim ──> Claim Status: 'Rejected' (Item remains 'Open')
       └── Approve Claim
                 │
                 ├── 1. Claim Status flips to 'Approved'
                 ├── 2. Item Status flips to 'Claimed'
                 └── 3. All other Pending Claims auto-rejected!
```

### Detailed Business Rules:
1. **Rule 1: Self-Claim Prevention:**  
   `if (item.reportedBy.equals(req.user.id))`  
   A student cannot claim an item they themselves reported. This blocks malicious finders from falsely self-resolving items.
2. **Rule 2: Item Availability Gate:**  
   `if (item.status !== 'Open')`  
   New claims are prohibited once an item has been marked `'Claimed'` or `'Resolved'`.
3. **Rule 3: Single Active Claim Constraint:**  
   `Claim.findOne({ itemId, claimant: req.user.id, status: { $in: ['Pending', 'Approved'] } })`  
   A student cannot flood a listing with multiple claims.
4. **Rule 4: State Mutation & Cascading Resolution:**  
   When a claim is `'Approved'`:
   - The selected claim status is set to `'Approved'`.
   - The referenced `Item`'s status flips from `'Open'` to `'Claimed'`.
   - Mongoose runs `Claim.updateMany({ itemId, _id: { $ne: claimId }, status: 'Pending' }, { status: 'Rejected' })`, automatically clearing competitors with polite feedback.
5. **Rule 5: Reversion Rule:**  
   If an approved claim is subsequently cancelled (e.g. claimant failed verification during physical handover):
   - The claim flips to `'Cancelled'` or `'Rejected'`.
   - The `Item` status automatically reverts back to `'Open'`, opening it up to other students again.

---

# Section 6: Deployment Walkthrough (Render + MongoDB Atlas)

### Step 1: MongoDB Atlas Cloud Setup
1. Create a free M0 tier cluster on [MongoDB Atlas](https://cloud.mongodb.com).
2. Create a Database User (`unifind_admin`) with password.
3. In **Network Access**, add IP `0.0.0.0/0` (Allow Access From Anywhere) to allow Render's dynamic container IPs to connect.
4. Obtain the connection string:
   `mongodb+srv://unifind_admin:<password>@cluster0.abcde.mongodb.net/unifind_db?retryWrites=true&w=majority`

### Step 2: Cloud Backend Deployment (Railway or Render)

#### Option A: Railway.app Deployment (Recommended - Zero Cold Starts)
1. Log into [Railway.com](https://railway.com/) and click **+ New Project -> Deploy from GitHub repo**.
2. Select your repository: `Lost-found`.
3. In service **Settings -> Service Settings**, set **Root Directory** to `backend`.
4. In **Variables**, add:
   - `NODE_ENV = production`
   - `JWT_SECRET = sliit_unifind_secure_jwt_secret_key_2026_se2020`
   - `MONGODB_URI = mongodb+srv://...`
5. In **Settings -> Networking**, click **Generate Domain**.
6. Test the live health check: `https://<your-service>.up.railway.app/api/health`.

#### Option B: Render.com Backend Deployment
1. Connect your GitHub repository to [Render.com](https://render.com).
2. Create a **New Web Service**:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
3. Configure Environment Variables in the Render dashboard:
   - `NODE_ENV = production`
   - `PORT = 10000`
   - `MONGODB_URI = mongodb+srv://...`
   - `JWT_SECRET = unifind_sliit_super_secret_jwt_key_2026`
   - `JWT_EXPIRE = 30d`
4. Deploy the service. Test the live health check: `https://<your-service>.onrender.com/api/health`.

### Step 3: Mobile App Configuration
- In React Native, users or examiners do not need to recompile the app to switch backend endpoints.
- Navigate to the **Profile** screen -> enter the live Railway or Render URL (e.g. `https://<service>.up.railway.app/api`) -> Tap **Save Server URL**.
- The app stores this in `AsyncStorage` and directs all future API requests and photo uploads to the cloud server.

---

# Section 7: One-Page Reflection — What Broke and How We Fixed It

During the iterative development of UniFind across the eight-week lifecycle, three primary technical obstacles occurred. Below is a structured reflection on the root causes, diagnostic steps, and solutions.

### Issue 1: Network Loopback on Mobile (Physical Devices & Android Emulator)
- **What Broke:**  
  While API calls worked flawlessly on Postman and Web browser, the React Native app failed with `Network Request Failed` when running on an Android emulator or a physical phone via Expo Go.
- **Root Cause:**  
  `localhost` on an Android emulator resolves to the emulator's own internal virtual interface (`127.0.0.1`), not the development PC host running Express. Similarly, a physical smartphone connected via USB or Wi-Fi treats `localhost` as the phone itself.
- **How We Fixed It:**  
  1. We designed `api/config.js` to dynamically inspect `Platform.OS`. For Android emulators, it defaults to `http://10.0.2.2:5000/api` (the host loopback IP).
  2. We built an in-app **API URL Switcher** in `ProfileScreen.js` backed by `AsyncStorage`. This allows instant switching between `localhost`, local Wi-Fi LAN IP (e.g. `192.168.1.15`), and the live production Render URL without code changes.

### Issue 2: Multer Multipart Form-Data Parsing in React Native
- **What Broke:**  
  When submitting a new item with an image from `expo-image-picker`, the Express backend threw `MulterError: Unexpected field` or `req.file` was undefined.
- **Root Cause:**  
  React Native's JavaScript `fetch` handles `FormData` differently from browser environments. Manually setting `'Content-Type': 'multipart/form-data'` in the request headers strips the browser/client-generated multipart boundary string (`boundary=----WebKitFormBoundary...`), making it impossible for Multer's stream parser to parse the file parts.
- **How We Fixed It:**  
  In `mobile/src/api/client.js`, we ensured that when the payload is an instance of `FormData`, we do **not** set the `Content-Type` header manually; we let React Native's native networking layer inject the correct header with the boundary delimiter. Furthermore, we formatted the file payload using `{ uri, name: filename, type: mimeType }` with proper extension detection (`.jpg`, `.png`, `.webp`).

### Issue 3: Business Logic Inconsistency & Race Conditions on Claim Approval
- **What Broke:**  
  When testing multiple claims, approving one claim updated the claim's status, but competitor claims remained `'Pending'`, and the item could still be claimed by third parties.
- **Root Cause:**  
  The status transition was previously performed across multiple decoupled routes without database transaction or cascading updates.
- **How We Fixed It:**  
  In `claimController.js` under `updateClaimStatus`, we unified the approval logic into an atomic multi-document sequence:
  1. Update target claim to `'Approved'`.
  2. Mutate referenced item status to `'Claimed'`.
  3. Execute `Claim.updateMany()` to reject all competing pending claims on that item with explanation text.
  4. Added a reversion rule that releases the item back to `'Open'` if an approved claim is later cancelled.

---

# Section 8: Comprehensive Viva Defense Master Guide (60 Marks)

This section prepares the student for every criterion in the SE2020 viva assessment rubric.

### Criterion 1: Explaining Your Implementation (20 Marks)
- **Q: Walk through the request flow when a user uploads an item.**  
  *Answer:*
  1. In `CreateItemScreen.js`, the student picks an image using `ImagePicker.launchImageLibraryAsync()`.
  2. A `FormData` object is populated with `title`, `category`, `type`, `location`, `description`, and the image file object.
  3. `apiClient.upload('/items', formData)` sends an HTTP `POST` request with the JWT in the `Authorization` header.
  4. The request hits `server.js` -> `itemRoutes.js`.
  5. The `protect` middleware validates the JWT and attaches `req.user`.
  6. The `upload.single('image')` Multer middleware verifies file type and 5MB size limit, writes the file to `/uploads`, and sets `req.file`.
  7. `itemController.createItem` validates mandatory fields, creates an `Item` document in MongoDB with `imageUrl: '/uploads/filename'`, and returns HTTP 201 with populated user details.

- **Q: How does token verification work on the backend?**  
  *Answer:*  
  In `backend/src/middleware/authMiddleware.js`, the `protect` function extracts the token from `req.headers.authorization`. It verifies the signature against `process.env.JWT_SECRET` using `jwt.verify()`. If valid, it fetches the user from MongoDB (excluding password) and sets `req.user`. If invalid or expired, it halts execution and returns HTTP 401 Unauthorized.

---

### Criterion 2: System Design Decisions (10 Marks)
- **Q: Why did you separate User, Item, and Claim into three distinct models instead of embedding claims in the Item document?**  
  *Answer:*  
  1. **Document Size & Concurrency:** In MongoDB, documents have a 16MB limit. Embedding claims inside an item creates concurrency write lock issues if multiple students submit claims simultaneously.
  2. **Query Performance:** Claims need to be queried from two independent perspectives: *claims submitted by a specific student* (`GET /api/claims/my-claims`) and *claims submitted for a specific item* (`GET /api/claims/item/:itemId`). Storing claims in a dedicated collection with an index on `itemId` and `claimant` provides optimal $O(1)$ query speed without duplicating data.
  3. **Assignment Scope Boundaries:** The assignment requires a primary entity (`Item`) and a related entity (`Claim`) referencing it, reflecting real-world relational modeling within a document store.

- **Q: Why did you use Multer with disk storage rather than storing base64 strings in MongoDB?**  
  *Answer:*  
  Base64 strings inflate image payload sizes by approximately 33% and severely bloat MongoDB document sizes and RAM cache. Storing images as physical files (or cloud bucket objects) and saving only the relative URL string (`/uploads/item-123.jpg`) keeps the database lightweight, query-efficient, and fast.

---

### Criterion 3: Backend & Database Concepts (10 Marks)
- **Q: What HTTP status codes are used in your system and why?**  
  *Answer:*  
  - `200 OK`: Successful GET, PUT, PATCH, or DELETE operations.
  - `201 Created`: Successful POST operations (User registered, Item created, Claim submitted).
  - `400 Bad Request`: Input validation failures or business logic violations (e.g. attempting to claim own item, duplicate claim).
  - `401 Unauthorized`: Missing, invalid, or expired JWT token.
  - `403 Forbidden`: Authenticated user attempting an unauthorized action (e.g. non-owner trying to approve claims on someone else's item).
  - `404 Not Found`: Target item or claim ID does not exist in the database.
  - `500 Internal Server Error`: Unhandled server-side exceptions, intercepted by `errorMiddleware.js`.

- **Q: How does bcrypt protect student passwords?**  
  *Answer:*  
  In `models/User.js`, a Mongoose `pre('save')` hook intercepts password changes. It generates a cryptographic salt (`bcrypt.genSalt(10)`) and hashes the plaintext password before writing to MongoDB. In `comparePassword`, bcrypt verifies candidate passwords using constant-time comparison to guard against timing attacks.

---

### Criterion 4: Mobile & API Interaction (10 Marks)
- **Q: How does the mobile app manage authentication state across restarts?**  
  *Answer:*  
  In `AuthContext.js`, upon successful login or registration, the JWT and serialized user object are persisted to persistent storage using `@react-native-async-storage/async-storage`. On app startup, an `useEffect` hook reads the stored token and calls `GET /api/auth/me`. If valid, the user enters `MainTabs`; if invalid or expired (401), the token is purged and the user is redirected to `LoginScreen`.

- **Q: How did you implement form validation with visible feedback?**  
  *Answer:*  
  Every form field is managed via React state (`useState`) and evaluated against a validation function before dispatching network requests. Errors are stored in an `errors` state object. `CustomInput` inspects `error` prop and dynamically renders a highlighted red border (`#EF4444`), soft pink background, and inline error text below the input field.

---

### Criterion 5: Problem Solving and Debugging ("What If" Scenarios) (10 Marks)
- **Q: What if a student claims an item, but during physical collection, the finder realizes the claimant is an impostor? How does your system recover?**  
  *Answer:*  
  In `ManageItemClaimsScreen.js`, the finder can open the claim and select **Reopen Item / Cancel**. The backend controller (`updateClaimStatus`) updates the claim status to `'Cancelled'` and automatically flips the `Item` status from `'Claimed'` back to `'Open'`. This allows other honest claimants to submit claims again immediately.

- **Q: What if two users submit a claim for the same item at the exact same millisecond?**  
  *Answer:*  
  Both claims will initially register as `'Pending'`, which is correct because multiple students may legitimately attempt to claim an item. However, the moment the reporter approves the genuine claimant, `updateClaimStatus` executes an atomic `Claim.updateMany({ itemId, _id: { $ne: approvedClaimId }, status: 'Pending' }, { status: 'Rejected' })`. This guarantees that only one claim can ever be `'Approved'`, and the item transitions to `'Claimed'`.

- **Q: What if the database goes down while the server is running?**  
  *Answer:*  
  Mongoose handles reconnection attempts automatically. If a query fails while disconnected, our centralized `errorMiddleware.js` catches the database error, logs the stack trace in development, and returns a clean JSON error response `{ success: false, message: 'Database query failed' }` with status 500, preventing the Node.js process from crashing.

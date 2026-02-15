# TaxPal - Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Backend Components](#backend-components)
6. [Authentication System](#authentication-system)
7. [API Endpoints](#api-endpoints)
8. [Database Models](#database-models)
9. [Setup Instructions](#setup-instructions)
10. [Missing Features](#missing-features)
11. [Security Issues](#security-issues)

---

## 🎯 Project Overview

**TaxPal** is a full-stack tax management application that helps users track income, expenses, and calculate tax obligations based on their jurisdiction and income bracket.

### Key Features
- User authentication (register, login, password reset)
- JWT-based secure access
- MongoDB database integration
- React-based frontend with routing
- Responsive UI with Tailwind CSS

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│          Frontend (React + Vite)            │
│  - Landing, Login, Register, Dashboard      │
│  - React Router for navigation               │
│  - Tailwind CSS for styling                  │
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST API
                   ▼
┌─────────────────────────────────────────────┐
│      Backend (Express.js - Port 5000)       │
│  - Authentication Routes                    │
│  - Protected Routes                         │
│  - Transaction Management                   │
│  - Error Handling & Middleware               │
└──────────────────┬──────────────────────────┘
                   │ Mongoose ODM
                   ▼
┌─────────────────────────────────────────────┐
│     Database (MongoDB Atlas/Local)          │
│  - Users Collection                         │
│  - Transactions Collection                  │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI library |
| React Router | 7.13.0 | Client-side routing |
| Vite | 7.3.1 | Build tool & dev server |
| Tailwind CSS | 3.4.4 | Styling |
| ESLint | 9.39.1 | Code quality |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Express.js | 5.2.1 | Web framework |
| Node.js | - | Runtime |
| MongoDB | - | Database |
| Mongoose | 9.2.1 | ODM |
| JWT | 9.0.3 | Authentication |
| bcryptjs | 3.0.3 | Password hashing |
| CORS | 2.8.6 | Cross-origin requests |

---

## 📁 Project Structure

```
taxpal/
├── client/                      # Frontend (React)
│   ├── src/
│   │   ├── App.jsx             # Main app component with routes
│   │   ├── main.jsx            # Entry point
│   │   ├── index.css           # Global styles
│   │   ├── App.css             # App-specific styles
│   │   ├── components/         # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── FeatureCard.jsx
│   │   │   └── SectionTitle.jsx
│   │   ├── pages/              # Page components
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ForgotPassword.jsx
│   │   └── assets/             # Images & static files
│   ├── public/                 # Public assets
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── eslint.config.js
│
└── server/                      # Backend (Express)
    ├── server.js               # Main server file
    ├── package.json
    ├── config/
    │   └── db.js              # MongoDB connection
    ├── models/
    │   ├── User.js            # User schema
    │   └── Transaction.js     # Transaction schema (empty)
    ├── controllers/
    │   ├── authController.js  # Auth logic (register, login, forgot-password)
    │   └── transactionController.js # Transaction logic (empty)
    ├── middleware/
    │   └── authMiddleware.js  # JWT verification
    ├── routes/
    │   ├── authRoutes.js      # Auth endpoints
    │   └── transactionRoutes.js # Transaction endpoints (empty)
    └── .gitignore             # Ignore node_modules, .env
```

---

## 🔧 Backend Components

### 1. Server Configuration (server.js)

```javascript
// Initializes Express server with:
- CORS middleware (allows cross-origin requests)
- JSON body parser (handles request bodies)
- Auth routes at /api/auth
- Protected route example
- Listens on PORT 5000
```

**Key Endpoints:**
- `GET /` → Health check
- `GET /api/protected` → Protected route (requires JWT)
- `POST /api/auth/*` → Authentication routes

---

### 2. Authentication Controller (authController.js)

#### **A. registerUser()**
Handles user registration with the following flow:

```
Request Body: { name, email, password, country, income_bracket }
                    ↓
        1. Validate required fields
                    ↓
        2. Check if user already exists (email)
                    ↓
        3. Hash password with bcryptjs (10 salt rounds)
                    ↓
        4. Create user in MongoDB
                    ↓
        Response: { message: "User registered successfully" }
```

**Issues Found:**
- ⚠️ `currency` field in schema but not accepted in registration
- ⚠️ No JWT token returned (user must login separately)

#### **B. loginUser()**
Authenticates user and returns JWT token:

```
Request Body: { email, password }
                    ↓
        1. Find user by email
                    ↓
        2. Compare password with hashed version (bcryptjs.compare)
                    ↓
        3. Generate JWT token (expires in 1 day)
                    ↓
        Response: { 
          message: "Login successful",
          token: "eyJhbGciOiJIUzI1NiIs..." 
        }
```

**Security:**
- Uses bcryptjs for password comparison
- JWT signed with `process.env.JWT_SECRET`
- Token expires in 24 hours

#### **C. forgotPassword()**
Allows password reset:

```
Request Body: { email, newPassword }
                    ↓
        1. Find user by email
                    ↓
        2. Hash new password
                    ↓
        3. Update password in database
                    ↓
        Response: { message: "Password reset successful" }
```

**🔴 SECURITY RISK:**
- No OTP/verification required
- Anyone can reset anyone's password if they know the email
- Should implement token-based or OTP verification

---

### 3. Authentication Middleware (authMiddleware.js)

Protects routes by verifying JWT tokens:

```javascript
const protect = (req, res, next) => {
  1. Check Authorization header: "Bearer <TOKEN>"
  2. Extract token from header
  3. Verify token with JWT_SECRET
  4. Decode token to get user ID
  5. Attach decoded user to req.user
  6. Call next() to proceed
}
```

**Header Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Usage in routes:**
```javascript
router.get("/dashboard", protect, (req, res) => {
  // req.user contains decoded token data
  res.json({ userId: req.user.id });
});
```

---

### 4. Database Configuration (config/db.js)

Connects to MongoDB using Mongoose:

```javascript
connectDB() {
  - Reads: process.env.MONGO_URI
  - Connects to MongoDB Atlas or local instance
  - Logs success message or exits on failure
}
```

**Required Environment Variables:**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/taxpal
JWT_SECRET=your_super_secret_key_here
```

---

## 📊 Database Models

### User Model

```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  country: String (default: "India"),
  income_bracket: Number (required),
  currency: String (required),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Example Document:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2a$10$abcdef...",
  "country": "India",
  "income_bracket": 500000,
  "currency": "INR",
  "createdAt": "2025-02-15T10:30:00Z",
  "updatedAt": "2025-02-15T10:30:00Z"
}
```

### Transaction Model (❌ EMPTY - Needs Implementation)

Should include:
```javascript
{
  userId: ObjectId (required, ref: User),
  amount: Number (required),
  type: String (enum: ["income", "expense"]),
  category: String (e.g., "salary", "medical", "education"),
  description: String,
  date: Date,
  receiptUrl: String (optional),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## 🔌 API Endpoints

### Authentication Routes

| Method | Endpoint | Body | Response | Status |
|--------|----------|------|----------|--------|
| POST | `/api/auth/register` | `{ name, email, password, country, income_bracket, currency }` | `{ message: "User registered successfully" }` | 201 |
| POST | `/api/auth/login` | `{ email, password }` | `{ message, accessToken, refreshToken }` | 200 |
| POST | `/api/auth/request-password-reset` | `{ email }` | `{ message: "Password reset email sent if account exists" }` | 200 |
| POST | `/api/auth/reset-password` | `{ token, newPassword }` | `{ message: "Password reset successful" }` | 200 |
| POST | `/api/auth/refresh` | `{ refreshToken }` | `{ accessToken }` | 200 |
| POST | `/api/auth/logout` | `{ refreshToken }` | `{ message: "Logged out" }` | 200 |

### Protected Routes (Examples)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/protected` | ✅ JWT Required | Example protected route |
| GET | `/api/transactions` | ✅ JWT Required | Get user transactions (NOT IMPLEMENTED) |
| POST | `/api/transactions` | ✅ JWT Required | Create transaction (NOT IMPLEMENTED) |
| PUT | `/api/transactions/:id` | ✅ JWT Required | Update transaction (NOT IMPLEMENTED) |
| DELETE | `/api/transactions/:id` | ✅ JWT Required | Delete transaction (NOT IMPLEMENTED) |

---

## 📖 Request/Response Examples

### 1. Register User

**Request:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "SecurePassword123",
  "country": "India",
  "income_bracket": 750000,
  "currency": "INR"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully"
}
```

**Response (400) - User exists:**
```json
{
  "message": "User already exists"
}
```

---

### 2. Login User

**Request:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmNzZhMzJlODhkMjMzMDAxNjBhMzJhMiIsImlhdCI6MTYyNDA2NzAwMCwiZXhwIjoxNjI0MTUzNDAwfQ.abc123def456..."
}
```

**Response (400) - Invalid credentials:**
```json
{
  "message": "Invalid credentials"
}
```

---

### 3. Reset Password

**Request:**
```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "alice@example.com",
  "newPassword": "NewPassword456"
}
```

**Response (200):**
```json
{
  "message": "Password reset successful"
}
```

---

### 4. Access Protected Route

**Request:**
```bash
GET /api/protected
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmNzZhMzJlODhkMjMzMDAxNjBhMzJhMiIsImlhdCI6MTYyNDA2NzAwMCwiZXhwIjoxNjI0MTUzNDAwfQ.abc123def456...
```

**Response (200):**
```json
{
  "message": "You accessed protected route",
  "user": {
    "id": "5f76a32e88d2330160a32a2"
  }
}
```

**Response (401) - No token:**
```json
{
  "message": "No token, access denied"
}
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas account)
- npm or yarn

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/taxpal
   JWT_SECRET=your_super_secret_key_change_this_in_production
   NODE_ENV=development
   ```

4. **Run server:**
   ```bash
   npm start
   # or with nodemon for development:
   npx nodemon server.js
   ```

   Expected output:
   ```
   ✅ MongoDB Connected
   🚀 Server running on port 5000
   ```

### Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

   Expected output:
   ```
   VITE v7.3.1  ready in 500 ms

   ➜  Local:   http://localhost:5173/
   ➜  press h to show help
   ```

---

## 🆕 Recent Backend Improvements (2026-02-15)

- **Input Validation:** Added request validation and sanitization for auth routes using `express-validator`. See [server/routes/authRoutes.js](server/routes/authRoutes.js).
- **Centralized Error Handling:** Added an error handler middleware to standardize error responses and logging: [server/middleware/errorHandler.js](server/middleware/errorHandler.js).
- **Password Reset (token + email):** Implemented token-based password reset flow:
  - `POST /api/auth/request-password-reset` — generates and stores a reset token on the user and attempts to email a reset link using SMTP. Email helper: [server/utils/email.js](server/utils/email.js).
  - `POST /api/auth/reset-password` — verifies token and expiry, updates password. User fields added in [server/models/User.js](server/models/User.js).
- **Refresh Token Flow:** Login now returns `accessToken` and `refreshToken`. Added endpoints for `refresh` and `logout` to issue new access tokens and invalidate refresh tokens. Controller: [server/controllers/authController.js](server/controllers/authController.js).
- **Logging:** Added Winston-based logging with console and file transport. Logger lives at [server/utils/logger.js](server/utils/logger.js) and writes to `server/logs/server.log`.
- **Package updates:** New dependencies added: `express-validator`, `nodemailer`, `winston` (see [server/package.json](server/package.json)).
- **CHANGELOG:** Full change details are in [server/CHANGELOG.md](server/CHANGELOG.md).

### New environment variables

- `JWT_REFRESH_SECRET` (optional) — secret for signing refresh tokens (falls back to `JWT_SECRET` if not provided).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — SMTP configuration for sending password reset emails.
- `FRONTEND_URL` — frontend base URL used to construct password reset links.

These additions improve security, observability, and user account workflows. If SMTP is not configured, password-reset requests will still succeed but no email will be sent (token remains stored on the user for manual testing).


## ⚠️ Missing Features

### 1. Transaction Management
- **Status:** ❌ Not Implemented
- **Files:** 
  - `models/Transaction.js` (empty)
  - `controllers/transactionController.js` (empty)
  - `routes/transactionRoutes.js` (empty)
- **Needed:**
  - Create transaction schema
  - Implement CRUD operations
  - Create protected routes
  - Add transaction filtering and pagination

### 2. Frontend Integration
- No API service layer
- No state management (Context API / Redux)
- No loading states or error handling
- No form validation
- No dashboard to display transactions

### 3. Email Verification
- Registration doesn't verify email
- Password reset has no verification step
- Should implement nodemailer for emails

### 4. Input Validation
- No request body validation
- No sanitization of inputs
- Should use libraries like `joi` or `express-validator`

### 5. Rate Limiting
- No protection against brute force attacks
- Should implement `express-rate-limit`

### 6. Advanced Features
- Refresh tokens (only 1-day expiration)
- Role-based access control (RBAC)
- Tax calculation logic
- Report generation
- File upload for receipts
- Two-factor authentication

---

## 🔴 Security Issues

### Critical 🔴
1. **Unsafe Password Reset**
   - No OTP or verification
   - Anyone can reset anyone's password
   - **Fix:** Implement token-based reset with email verification

2. **No Input Validation**
   - SQL injection possible (though MongoDB helps)
   - XSS attacks possible
   - **Fix:** Use `joi` or `express-validator`

### High 🟠
3. **Missing HTTPS**
   - Should only use HTTPS in production
   - JWT tokens transmitted in plain HTTP

4. **Weak JWT Configuration**
   - 24-hour expiration only
   - No refresh token mechanism
   - JWT_SECRET might be weak

### Medium 🟡
5. **No Rate Limiting**
   - Login endpoint can be brute forced
   - Registration endpoint can be spammed

6. **Error Messages Too Verbose**
   - "Invalid credentials" is good
   - But other errors reveal system info

### Low 🟢
7. **No CORS Restriction**
   - `cors()` allows all origins
   - Should specify `whitelist: ['http://localhost:3000']`

---

## 📝 Next Steps

### Priority 1 (Critical)
- [ ] Implement Transaction model and controller
- [ ] Add transaction routes
- [ ] Fix password reset security
- [ ] Add input validation

### Priority 2 (Important)
- [ ] Implement email verification
- [ ] Add rate limiting
- [ ] Create dashboard UI
- [ ] Add state management

### Priority 3 (Enhancement)
- [ ] Tax calculation logic
- [ ] Report generation
- [ ] File upload for receipts
- [ ] Advanced filtering

---

## 📚 Resources

- [Express.js Docs](https://expressjs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [JWT Introduction](https://jwt.io/introduction)
- [React Router](https://reactrouter.com/)
- [Mongoose ODM](https://mongoosejs.com/)

---

## 👥 Team

- **Project:** TaxPal
- **Repository:** arvind-pal-101/taxpal
- **Status:** In Development
- **Last Updated:** February 15, 2026

---

**Generated: February 15, 2026**

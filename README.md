# MILZO – Milk Delivery Management System

MILZO is a modern, enterprise-grade Milk Delivery Management System designed for distributors and dairy businesses. It offers a production-ready, full-stack Admin Console with a complete React/Vite client frontend and a robust Node.js/Express/MongoDB backend server.

---

## 🚀 Key Features

- **RBAC Security:** Role-Based Access Control protecting routes and endpoints (SuperAdmin, Admin, Dispatch Manager, Customer Service).
- **Core Operations:** Comprehensive CRUD modules for Customers, Vendors, Products, Orders, and Routes.
- **Advanced Subscription Engine:** Manage recurring daily, alternate, or weekly plans. Pause/resume/cancel dispatches with automatic wallet calculations.
- **Logistics & Dispatch:** Track vehicle logs, schedule delivery agents, assign routes, and mark roster attendance.
- **Instant Gateways:** Integration endpoints ready for Razorpay/Stripe recharges.
- **Interactive Dashboards:** Visualized sales performance, revenue trends, and delivery stop KPIs via Recharts.
- **System Logs:** Dedicated interfaces to audit system activities and resolve backend runtime exceptions.
- **Notification Center:** Real-time reminders on low inventory levels, customer tickets, and dispatch status alerts.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React.js (v18), Vite, Tailwind CSS, Redux Toolkit, React Query, Recharts, Lucide Icons, React Hot Toast |
| **Backend** | Node.js, Express.js, MongoDB (Mongoose ODM) |
| **Security** | JWT (Session & Refresh tokens), bcryptjs, Helmet, Express Rate Limit, Mongo Sanitize |
| **Integrations** | Cloudinary (Doc uploads), Razorpay (Payments mock endpoints), Nodemailer (SMTP dispatch) |
| **Logging** | Winston Logger (Error / Info logs) |

---

## 📂 Project Structure

```text
milzo/
├── backend/
│   ├── config/          # DB, Cloudinary, Razorpay settings
│   ├── controllers/     # Route controller endpoints logic
│   ├── middleware/      # Auth security, RBAC checks, rate limiters
│   ├── models/          # 16 Mongoose DB schemas
│   ├── routes/          # API endpoint router maps
│   ├── utils/           # Winston logger, Nodemailer wrappers, responses
│   └── server.js        # Express application entry point
│
└── frontend/
    ├── public/          # Favicon, assets
    ├── src/
    │   ├── components/  # Shared layouts (DataTable, Modal, ThemeToggle)
    │   ├── layouts/     # Route wrappers (AdminLayout, AuthLayout)
    │   ├── pages/       # 19 Admin UI Page views
    │   ├── redux/       # Store configurations and slice reducers
    │   ├── services/    # Axios instance with 401 interceptors
    │   ├── index.css    # Global Tailwind styling & animations
    │   └── main.jsx     # Vite client bootstrap
```

---

## ⚡ Quick Start

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v16+) and [MongoDB](https://www.mongodb.com/) running locally.

### 2. Backend Installation & Run
1. Go to backend directory:
   ```bash
   cd backend
   ```
2. Install server packages:
   ```bash
   npm install
   ```
3. Copy environment variables file:
   ```bash
   cp .env.example .env
   ```
4. Fill variables inside `.env` (MongoDB connection string, JWT secret, Cloudinary config).
5. Start the server (runs on port `5000` by default):
   ```bash
   npm run dev
   ```

### 3. Frontend Installation & Run
1. Go to frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install client packages:
   ```bash
   npm install
   ```
3. Launch client dev server (starts on port `3000` with API proxying to `5000`):
   ```bash
   npm run dev
   ```

---

## 🛡️ Default Access
Seed super admin user details to log in:
- **Email:** `admin@milzo.com`
- **Password:** `Admin@123456`

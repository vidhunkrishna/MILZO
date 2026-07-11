# 🥛 MILZO – Milk Delivery Management System

MILZO is a modern, enterprise-grade Milk Delivery Management System designed for distributors and dairy businesses. It offers a production-ready, full-stack Admin Console with a complete React/Vite client frontend and a robust Node.js/Express backend integrated with **Supabase (PostgreSQL)**.

---

## 🚀 Key Features

- **RBAC Security:** Role-Based Access Control protecting routes and endpoints (SuperAdmin, OperationsManager, FinanceManager, DeliveryManager, CustomerSupport).
- **Core Operations:** Comprehensive CRUD modules for Customers, Vendors, Products, Orders, and Routes.
- **Advanced Subscription Engine:** Manage recurring daily, alternate, or weekly plans. Pause/resume/cancel dispatches with automatic wallet calculations.
- **Logistics & Dispatch:** Track vehicle logs, schedule delivery agents, assign routes, and manage shifts.
- **Instant Gateways:** Integration endpoints ready for Razorpay/Stripe recharges.
- **Interactive Dashboards:** Visualized sales performance, revenue trends, and delivery stop KPIs via Recharts, powered by optimized Supabase RPC (Remote Procedure Call) database functions.
- **System Logs:** Dedicated interfaces to audit system activities and resolve backend runtime exceptions.
- **Notification Center:** Real-time reminders on low inventory levels, customer tickets, and dispatch status alerts.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React.js (v18), Vite, Tailwind CSS, Redux Toolkit, TanStack React Query, Recharts, Lucide Icons, Framer Motion, React Hot Toast |
| **Backend** | Node.js, Express.js |
| **Database** | **Supabase (PostgreSQL)** with custom PL/pgSQL functions and schema |
| **Security** | JWT (Session & Refresh tokens), bcryptjs, Helmet, Express Rate Limit |
| **Integrations** | Cloudinary (Doc/avatar uploads), Razorpay (Payments mock endpoints), Nodemailer (SMTP dispatch) |
| **Logging** | Winston Logger (Error / Info logs) |

---

## 📂 Project Structure

```text
milzo/
├── backend/
│   ├── config/              # Supabase, Cloudinary, Razorpay settings
│   ├── controllers/         # Route controller endpoints logic
│   ├── middleware/          # Auth security, RBAC checks, rate limiters
│   ├── models/              # Compat-layer querying Supabase tables
│   ├── routes/              # API endpoint router maps
│   ├── utils/               # Winston logger, Nodemailer wrappers, responses
│   ├── supabase_schema.sql  # Database schema definition
│   ├── supabase_functions.sql # RPC functions for dashboard/analytics
│   ├── generate_seed_sql.js # Script to generate Super Admin SQL seed
│   └── server.js            # Express application entry point
│
└── frontend/
    ├── public/              # Favicon, assets
    ├── src/
    │   ├── components/      # Shared layouts (DataTable, Modal, ThemeToggle)
    │   ├── layouts/         # Route wrappers (AdminLayout, AuthLayout)
    │   ├── pages/           # 19 Admin UI Page views
    │   ├── redux/           # Store configurations and slice reducers
    │   ├── services/        # Axios instance with 401 interceptors
    │   ├── index.css        # Global Tailwind styling & animations
    │   └── main.jsx         # Vite client bootstrap
```

---

## ⚡ Quick Start

### 1. Prerequisites
Ensure you have:
- [Node.js](https://nodejs.org/) (v18+ recommended)
- A [Supabase](https://supabase.com/) account and project set up.

---

### 2. Database Setup (Supabase)

MILZO uses Supabase as its primary PostgreSQL database. Follow these steps to initialize it:

1. **Run the Database Schema:**
   - Go to your Supabase project dashboard.
   - Open the **SQL Editor** from the left sidebar.
   - Click **New query**, paste the contents of [backend/supabase_schema.sql](file:///c:/Users/valli/Downloads/MILZO%20proj/backend/supabase_schema.sql), and click **Run**.

2. **Create the RPC Functions:**
   - In the SQL Editor, create a new query.
   - Paste the contents of [backend/supabase_functions.sql](file:///c:/Users/valli/Downloads/MILZO%20proj/backend/supabase_functions.sql) and click **Run**. (These functions are required for dashboard statistics and charts).

3. **Seed the Super Admin:**
   - Run the seed script generator locally in the backend folder to output the SQL insert command for the default admin user:
     ```bash
     cd backend
     npm install
     node generate_seed_sql.js
     ```
   - Copy the generated `INSERT INTO users` block from the console.
   - Paste it into the Supabase SQL Editor and click **Run**. This creates the initial `Super Admin` user.

---

### 3. Backend Setup & Run

1. **Configure Environment Variables:**
   - In the `backend/` directory, copy the `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open the `.env` file and configure the required environment variables:
     ```env
     # Server Configuration
     NODE_ENV=development
     PORT=5000
     CLIENT_URL=http://localhost:3000

     # Supabase (PostgreSQL Database)
     SUPABASE_URL=https://your-project-id.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

     # JWT Authentication
     JWT_SECRET=your_super_secret_jwt_key_min_32_chars
     JWT_EXPIRE=7d
     JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars
     JWT_REFRESH_EXPIRE=30d

     # Cloudinary Integration (Image Uploads)
     CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
     CLOUDINARY_API_KEY=your_cloudinary_api_key
     CLOUDINARY_API_SECRET=your_cloudinary_api_secret

     # Razorpay Gateway Integration (Test / Live Mode)
     RAZORPAY_KEY_ID=your_razorpay_key_id
     RAZORPAY_KEY_SECRET=your_razorpay_key_secret

     # Nodemailer SMTP Email settings
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_USER=your-smtp-email@gmail.com
     SMTP_PASS=your-smtp-app-password
     FROM_EMAIL=no-reply@milzo.com
     FROM_NAME="MILZO Support"

     # Default Super Admin Seed Credentials
     SUPER_ADMIN_EMAIL=admin@milzo.com
     SUPER_ADMIN_PASSWORD=Admin@123456
     ```

2. **Start the Express Server:**
   - While in the `backend/` directory, start the server in development mode:
     ```bash
     npm run dev
     ```
   - The server runs on port `5000` by default.

---

### 4. Frontend Setup & Run

1. **Go to the frontend directory:**
   ```bash
   cd ../frontend
   ```
2. **Install client packages:**
   ```bash
   npm install
   ```
3. **Launch client dev server:**
   ```bash
   npm run dev
   ```
   - The client will run on port `3000` with requests proxied to the backend server.

---

## 🛡️ Default Access Credentials

After seeding the database, log in with the following default Super Admin credentials:
- **Email:** `admin@milzo.com`
- **Password:** `Admin@123456`

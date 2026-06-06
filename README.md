# Odoo-X VendorBridge ERP 🚀

![VendorBridge Banner](https://img.shields.io/badge/VendorBridge-B2B_Procurement-blue?style=for-the-badge)

VendorBridge is a comprehensive and secure **B2B Procurement and Vendor Management ERP System**. It streamlines the entire procurement lifecycle—from creating Request for Quotations (RFQs) and managing vendor bids, to generating Purchase Orders (POs) and processing Invoices.

## ✨ Features

- **🛡️ Multi-Role Access Control (RBAC):** Dedicated portals for `Admin`, `Procurement Officer`, `Manager`, and `Vendor`.
- **🔐 Secure Registration Workflow:** New users/vendors are placed in a `Pending` state and require Admin approval to access the system.
- **📄 RFQ & Quotation Management:** Procurement officers can create RFQs, and assigned vendors can securely submit itemized bids.
- **⚖️ Smart Quotation Comparison:** System auto-recommends the most cost-effective vendor quotation based on total bid value.
- **✅ Managerial Approvals:** Quotations must be approved by designated Managers before generating Purchase Orders.
- **🧾 Automated Documents:** One-click generation of professional PDF formats for Purchase Orders and Invoices.
- **📊 Real-time Reports:** Interactive charts and statistics for procurement spend, order volume, and vendor performance.
- **🇮🇳 Localized Currency:** Fully configured for Indian Rupees (₹) transactions.

## 🛠️ Tech Stack

### Frontend
- **React** (TypeScript + Vite)
- **React Router** for secure, role-based navigation
- **Lucide React** for modern UI icons
- **Recharts** for interactive data visualization
- Custom CSS (`index.css`) with premium, responsive design aesthetics

### Backend
- **Node.js & Express.js**
- **MySQL** (using `mysql2/promise` for async DB operations)
- **JSON Web Tokens (JWT)** for robust authentication & session management
- **Cloudinary** integration for secure file/image uploads

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MySQL Server

### 1. Database Setup
1. Create a MySQL database (e.g., `vendorbridge_db`).
2. Run the provided schema file to create all necessary tables:
   ```bash
   mysql -u your_username -p vendorbridge_db < backend/database/schema.sql
   ```

### 2. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory and configure your environment variables:
   ```env
   PORT=5000
   AIVEN_DB_URL=mysql://user:password@host:port/database
   JWT_SECRET=your_super_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Start the backend server:
   ```bash
   npm run dev
   # OR
   npm start
   ```

### 3. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 👥 Default User Roles
When logging in or registering, the system categorizes users into:
- **Admin:** Manages user approvals, roles, and system-wide settings.
- **Procurement Officer:** Creates RFQs, analyzes bids, requests manager approvals, and generates POs.
- **Manager:** Reviews and approves/rejects vendor quotations.
- **Vendor:** Views assigned RFQs, submits quotations, and tracks their POs & Invoices.

## 🔒 Security Best Practices Implemented
- Passwords are cryptographically hashed using **bcrypt**.
- Sessions are managed exclusively via HTTP-only capable architecture or secure `localStorage` JWTs.
- Protected Routes wrap all sensitive views, booting unauthenticated users back to the login screen.
- Strict backend middleware validates the `user.role` from the JWT for all sensitive operations (e.g., preventing a Vendor from approving their own quotation).

---
*Built for the Hackathon with ❤️ by Team Odoo-X KSV*

-- =========================================================================
-- VENDORBRIDGE ERP - FINAL HACKATHON SCHEMA
-- =========================================================================

USE defaultdb;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS approval_workflows;
DROP TABLE IF EXISTS quotation_items;
DROP TABLE IF EXISTS quotations;
DROP TABLE IF EXISTS rfq_vendors;
DROP TABLE IF EXISTS rfq_items;
DROP TABLE IF EXISTS rfqs;
DROP TABLE IF EXISTS vendor_details;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS categories;

SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================================
-- 0. CATEGORIES
-- =========================================================================

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 1. USERS
-- =========================================================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
	
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
	profile_photo TEXT,
    role ENUM(
        'Procurement Officer',
        'Vendor',
        'Manager',
        'Admin'
    ) NOT NULL,

    status ENUM(
        'Active',
        'Suspended'
    ) DEFAULT 'Active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================================
-- 2. VENDOR DETAILS
-- =========================================================================

CREATE TABLE vendor_details (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL UNIQUE,

    company_name VARCHAR(150) NOT NULL,

    gst_number VARCHAR(15) NOT NULL UNIQUE,

    category VARCHAR(100),

    address TEXT,

    rating_indicator DECIMAL(3,2) DEFAULT 5.00,

    status ENUM(
        'Pending Verification',
        'Approved',
        'Blacklisted'
    ) DEFAULT 'Pending Verification',

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (category)
        REFERENCES categories(name)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================================
-- 3. RFQS
-- =========================================================================

CREATE TABLE rfqs (
    id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(150) NOT NULL,

    description TEXT,

    category VARCHAR(100) NOT NULL,

    deadline DATETIME NOT NULL,

    status ENUM(
        'Draft',
        'Published',
        'Under Review',
        'Closed'
    ) DEFAULT 'Draft',

    attachment_url TEXT,

    created_by INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (category)
        REFERENCES categories(name)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- =========================================================================
-- 4. RFQ ITEMS
-- =========================================================================

CREATE TABLE rfq_items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    rfq_id INT NOT NULL,

    item_name VARCHAR(150) NOT NULL,

    quantity INT NOT NULL CHECK(quantity > 0),

    unit VARCHAR(20) NOT NULL,

    FOREIGN KEY (rfq_id)
        REFERENCES rfqs(id)
        ON DELETE CASCADE
);

-- =========================================================================
-- 5. RFQ ASSIGNED VENDORS
-- =========================================================================

CREATE TABLE rfq_vendors (
    rfq_id INT NOT NULL,

    vendor_id INT NOT NULL,

    PRIMARY KEY (rfq_id, vendor_id),

    FOREIGN KEY (rfq_id)
        REFERENCES rfqs(id)
        ON DELETE CASCADE,

    FOREIGN KEY (vendor_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================================================
-- 6. QUOTATIONS
-- =========================================================================

CREATE TABLE quotations (
    id INT AUTO_INCREMENT PRIMARY KEY,

    rfq_id INT NOT NULL,

    vendor_id INT NOT NULL,

    vendor_notes TEXT,

    status ENUM(
        'Submitted',
        'Accepted',
        'Rejected'
    ) DEFAULT 'Submitted',

    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (rfq_id, vendor_id),

    FOREIGN KEY (rfq_id)
        REFERENCES rfqs(id)
        ON DELETE CASCADE,

    FOREIGN KEY (vendor_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- =========================================================================
-- 7. QUOTATION ITEMS
-- =========================================================================

CREATE TABLE quotation_items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    quotation_id INT NOT NULL,

    rfq_item_id INT NOT NULL,

    quantity_bidded INT NOT NULL DEFAULT 1,

    unit_price DECIMAL(12,2) NOT NULL,

    gst_percentage DECIMAL(5,2) DEFAULT 0.00,

    delivery_timeline_days INT NOT NULL,

    total_price_without_tax DECIMAL(12,2)
    GENERATED ALWAYS AS (
        quantity_bidded * unit_price
    ) STORED,

    net_price_with_gst DECIMAL(12,2)
    GENERATED ALWAYS AS (
        (quantity_bidded * unit_price)
        * (1 + gst_percentage / 100)
    ) STORED,

    FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE CASCADE,

    FOREIGN KEY (rfq_item_id)
        REFERENCES rfq_items(id)
        ON DELETE RESTRICT
);

-- =========================================================================
-- 8. APPROVAL WORKFLOW
-- =========================================================================

CREATE TABLE approval_workflows (
    id INT AUTO_INCREMENT PRIMARY KEY,

    quotation_id INT NOT NULL UNIQUE,

    approver_id INT NOT NULL,

    action ENUM(
        'Pending',
        'Approved',
        'Rejected'
    ) DEFAULT 'Pending',

    remarks TEXT,

    reviewed_at TIMESTAMP NULL,

    FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE CASCADE,

    FOREIGN KEY (approver_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);

-- =========================================================================
-- 9. PURCHASE ORDERS
-- =========================================================================

CREATE TABLE purchase_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,

    po_number VARCHAR(50) NOT NULL UNIQUE,

    quotation_id INT NOT NULL UNIQUE,

    total_amount DECIMAL(12,2) NOT NULL,

    status ENUM(
        'Issued',
        'Acknowledged',
        'Completed',
        'Cancelled'
    ) DEFAULT 'Issued',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE RESTRICT
);

-- =========================================================================
-- 10. INVOICES
-- =========================================================================

CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,

    po_id INT NOT NULL UNIQUE,

    invoice_number VARCHAR(50) NOT NULL UNIQUE,

    subtotal_amount DECIMAL(12,2) NOT NULL,

    tax_amount DECIMAL(12,2) NOT NULL,

    total_amount DECIMAL(12,2)
    GENERATED ALWAYS AS (
        subtotal_amount + tax_amount
    ) STORED,

    status ENUM(
        'Unpaid',
        'Partially Paid',
        'Paid',
        'Overdue'
    ) DEFAULT 'Unpaid',

    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (po_id)
        REFERENCES purchase_orders(id)
        ON DELETE RESTRICT
);

-- =========================================================================
-- 11. ACTIVITY LOGS
-- =========================================================================

CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NULL,

    activity_type VARCHAR(50) NOT NULL,

    log_summary TEXT NOT NULL,

    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- =========================================================================
-- INDEXES FOR DASHBOARD / REPORTS
-- =========================================================================

CREATE INDEX idx_rfq_status
ON rfqs(status);

CREATE INDEX idx_quote_status
ON quotations(status);

CREATE INDEX idx_invoice_status
ON invoices(status);

CREATE INDEX idx_user_role
ON users(role);

CREATE INDEX idx_po_status
ON purchase_orders(status);

-- INSERT DEFAULT CATEGORIES
INSERT IGNORE INTO categories (name) VALUES 
('Furniture'), 
('IT Equipment'), 
('Stationery'), 
('Raw Materials'), 
('Logistics');


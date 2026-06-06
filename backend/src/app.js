require('dotenv').config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/users.routes");
const vendorRoutes = require("./routes/vendors.routes");
const rfqRoutes = require("./routes/rfqs.routes");
const rfqItemsRoutes = require("./routes/rfq-items.routes");
const quotationRoutes = require("./routes/quotations.routes");
const quotationItemsRoutes = require("./routes/quotation-items.routes");
const approvalRoutes = require("./routes/approvals.routes");
const purchaseOrderRoutes = require("./routes/purchase-orders.routes");
const invoiceRoutes = require("./routes/invoices.routes");
const activityLogRoutes = require("./routes/activity-logs.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const notificationRoutes = require("./routes/notifications.routes");
const categoriesRoutes = require("./routes/categories.routes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/rfqs", rfqRoutes);
app.use("/api/rfq-items", rfqItemsRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/quotation-items", quotationItemsRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/categories", categoriesRoutes);

// Global Error Handler to always return JSON
app.use((err, req, res, next) => {
    console.error("Global Error:", err);
    res.status(500).json({ message: err.message || "Something went wrong!" });
});

module.exports = app;
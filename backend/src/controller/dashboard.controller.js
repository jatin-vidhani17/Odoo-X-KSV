const db = require('../config/db');

// 1. Get Dashboard Summary Statistics
const getDashboardSummary = async (req, res) => {
    try {
        // Query counts in parallel
        const vendorsQuery = "SELECT COUNT(*) AS total FROM vendor_details";
        const rfqsQuery = "SELECT status, COUNT(*) AS count FROM rfqs GROUP BY status";
        const approvalsQuery = "SELECT COUNT(*) AS count FROM approval_workflows WHERE action = 'Pending'";
        const poQuery = "SELECT status, SUM(total_amount) AS total_val, COUNT(*) AS count FROM purchase_orders GROUP BY status";
        const invoiceQuery = "SELECT status, COUNT(*) AS count FROM invoices GROUP BY status";

        const [vendorsRows] = await db.query(vendorsQuery);
        const [rfqsRows] = await db.query(rfqsQuery);
        const [approvalsRows] = await db.query(approvalsQuery);
        const [poRows] = await db.query(poQuery);
        const [invoiceRows] = await db.query(invoiceQuery);

        // Map RFQ counts
        const rfqCounts = { Draft: 0, Published: 0, Under_Review: 0, Closed: 0, Total: 0 };
        rfqsRows.forEach(row => {
            const statusKey = row.status.replace(" ", "_");
            rfqCounts[statusKey] = row.count;
            rfqCounts.Total += row.count;
        });

        // Map PO summary
        let totalPOValue = 0;
        let totalPOCount = 0;
        const poStatusCounts = {};
        poRows.forEach(row => {
            totalPOValue += parseFloat(row.total_val || 0);
            totalPOCount += row.count;
            poStatusCounts[row.status] = row.count;
        });

        // Map Invoice summary
        const invoiceStatusCounts = {};
        invoiceRows.forEach(row => {
            invoiceStatusCounts[row.status] = row.count;
        });

        return res.status(200).json({
            success: true,
            data: {
                total_vendors: vendorsRows[0].total,
                rfq_summary: rfqCounts,
                pending_approvals: approvalsRows[0].count,
                purchase_orders: {
                    total_count: totalPOCount,
                    total_value: totalPOValue,
                    status_breakdown: poStatusCounts
                },
                invoices: {
                    status_breakdown: invoiceStatusCounts
                }
            }
        });
    } catch (error) {
        console.error("Error in getDashboardSummary:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 2. Vendor Analytics
const getVendorAnalytics = async (req, res) => {
    try {
        const query = `
            SELECT 
                vd.id AS vendor_id,
                vd.company_name,
                vd.category,
                vd.rating_indicator,
                vd.status AS verification_status,
                COUNT(q.id) AS bids_submitted,
                SUM(CASE WHEN q.status = 'Accepted' THEN 1 ELSE 0 END) AS bids_accepted,
                SUM(CASE WHEN q.status = 'Rejected' THEN 1 ELSE 0 END) AS bids_rejected
            FROM vendor_details vd
            LEFT JOIN quotations q ON vd.user_id = q.vendor_id
            GROUP BY vd.id, vd.company_name, vd.category, vd.rating_indicator, vd.status
            ORDER BY vd.rating_indicator DESC, bids_submitted DESC
        `;
        const [rows] = await db.query(query);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error in getVendorAnalytics:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 3. Procurement Analytics (RFQs Category distribution)
const getProcurementAnalytics = async (req, res) => {
    try {
        const query = `
            SELECT 
                category,
                COUNT(*) AS total_rfqs,
                SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) AS drafts,
                SUM(CASE WHEN status = 'Published' THEN 1 ELSE 0 END) AS published,
                SUM(CASE WHEN status = 'Under Review' THEN 1 ELSE 0 END) AS under_review,
                SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) AS closed
            FROM rfqs
            GROUP BY category
            ORDER BY total_rfqs DESC
        `;
        const [rows] = await db.query(query);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error in getProcurementAnalytics:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 4. Spending Analytics
const getSpendingAnalytics = async (req, res) => {
    try {
        const query = `
            SELECT 
                r.category,
                SUM(po.total_amount) AS total_spent,
                COUNT(po.id) AS po_count,
                AVG(po.total_amount) AS average_po_value
            FROM purchase_orders po
            INNER JOIN quotations q ON po.quotation_id = q.id
            INNER JOIN rfqs r ON q.rfq_id = r.id
            WHERE po.status != 'Cancelled'
            GROUP BY r.category
            ORDER BY total_spent DESC
        `;
        const [rows] = await db.query(query);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error in getSpendingAnalytics:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 5. Monthly Trends
const getMonthlyTrends = async (req, res) => {
    try {
        // Query monthly volume of RFQs, Quotations, and POs separately and union them or query dates
        // Since MySQL DATE_FORMAT is safe, let's group by month using subqueries and union/join
        const query = `
            SELECT m.month,
                   COALESCE(rfq.count, 0) AS rfqs_created,
                   COALESCE(quote.count, 0) AS quotations_submitted,
                   COALESCE(po.count, 0) AS pos_issued
            FROM (
                SELECT DISTINCT DATE_FORMAT(created_at, '%Y-%m') AS month FROM rfqs
                UNION
                SELECT DISTINCT DATE_FORMAT(submitted_at, '%Y-%m') AS month FROM quotations
                UNION
                SELECT DISTINCT DATE_FORMAT(created_at, '%Y-%m') AS month FROM purchase_orders
            ) m
            LEFT JOIN (
                SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count 
                FROM rfqs GROUP BY month
            ) rfq ON m.month = rfq.month
            LEFT JOIN (
                SELECT DATE_FORMAT(submitted_at, '%Y-%m') AS month, COUNT(*) AS count 
                FROM quotations GROUP BY month
            ) quote ON m.month = quote.month
            LEFT JOIN (
                SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count 
                FROM purchase_orders GROUP BY month
            ) po ON m.month = po.month
            ORDER BY m.month DESC
            LIMIT 12
        `;

        const [rows] = await db.query(query);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error in getMonthlyTrends:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    getDashboardSummary,
    getVendorAnalytics,
    getProcurementAnalytics,
    getSpendingAnalytics,
    getMonthlyTrends
};

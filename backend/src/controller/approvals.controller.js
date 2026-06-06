const db = require('../config/db');

// 1. Create Approval Entry
const createApproval = async (req, res) => {
    try {
        const { quotation_id, approver_id, remarks } = req.body;

        if (!quotation_id || !approver_id) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Check if approval already exists for this quotation
        const [existing] = await db.query("SELECT id FROM approval_workflows WHERE quotation_id = ?", [quotation_id]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: "Approval workflow already exists for this quotation" });
        }

        const query = `
            INSERT INTO approval_workflows (quotation_id, approver_id, action, remarks)
            VALUES (?, ?, 'Pending', ?)
        `;
        const [result] = await db.query(query, [quotation_id, approver_id, remarks || null]);

        return res.status(201).json({
            success: true,
            message: "Approval workflow initiated",
            data: { approval_id: result.insertId }
        });
    } catch (error) {
        console.error("Error in createApproval:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 2. Approve Quotation
const approveQuotation = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10); // approval_workflows.id
        const { remarks } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid approval ID format" });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Get approval details
            const [approvalRows] = await connection.query(
                "SELECT quotation_id FROM approval_workflows WHERE id = ?",
                [id]
            );

            if (approvalRows.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ success: false, message: "Approval entry not found" });
            }

            const quotationId = approvalRows[0].quotation_id;

            // Get quotation details to find the RFQ ID
            const [quoteRows] = await connection.query(
                "SELECT rfq_id FROM quotations WHERE id = ?",
                [quotationId]
            );

            if (quoteRows.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ success: false, message: "Associated quotation not found" });
            }

            const rfqId = quoteRows[0].rfq_id;

            // 1. Update Approval workflow state
            await connection.query(
                `UPDATE approval_workflows SET
                    action = 'Approved',
                    remarks = COALESCE(?, remarks),
                    reviewed_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [remarks || null, id]
            );

            // 2. Update this quotation status to 'Accepted'
            await connection.query(
                "UPDATE quotations SET status = 'Accepted' WHERE id = ?",
                [quotationId]
            );

            // 3. Update all other quotations for the same RFQ to 'Rejected'
            await connection.query(
                "UPDATE quotations SET status = 'Rejected' WHERE rfq_id = ? AND id != ?",
                [rfqId, quotationId]
            );

            // 4. Update RFQ status to 'Closed'
            await connection.query(
                "UPDATE rfqs SET status = 'Closed' WHERE id = ?",
                [rfqId]
            );

            await connection.commit();
            return res.status(200).json({ success: true, message: "Quotation approved and finalized successfully" });

        } catch (err) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: err.message });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error in approveQuotation:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 3. Reject Quotation
const rejectQuotation = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { remarks } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid approval ID format" });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Get approval details
            const [approvalRows] = await connection.query(
                "SELECT quotation_id FROM approval_workflows WHERE id = ?",
                [id]
            );

            if (approvalRows.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ success: false, message: "Approval entry not found" });
            }

            const quotationId = approvalRows[0].quotation_id;

            // 1. Update Approval workflow state
            await connection.query(
                `UPDATE approval_workflows SET
                    action = 'Rejected',
                    remarks = COALESCE(?, remarks),
                    reviewed_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [remarks || null, id]
            );

            // 2. Update quotation status to 'Rejected'
            await connection.query(
                "UPDATE quotations SET status = 'Rejected' WHERE id = ?",
                [quotationId]
            );

            await connection.commit();
            return res.status(200).json({ success: true, message: "Quotation rejected successfully" });

        } catch (err) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: err.message });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error in rejectQuotation:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 4. Get Approval details by ID
const getApprovalById = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid approval ID format" });
        }

        const query = `
            SELECT aw.*, q.rfq_id, q.vendor_id, u.name AS approver_name
            FROM approval_workflows aw
            INNER JOIN users u ON aw.approver_id = u.id
            INNER JOIN quotations q ON aw.quotation_id = q.id
            WHERE aw.id = ?
        `;

        const [rows] = await db.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Approval entry not found" });
        }

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error("Error in getApprovalById:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 5. Get all Approvals (with filters)
const listApprovals = async (req, res) => {
    try {
        const { action, approver_id } = req.query;
        let query = `
            SELECT aw.*, q.rfq_id, q.vendor_id, u.name AS approver_name,
                   r.title AS rfq_title, vd.company_name AS vendor_name
            FROM approval_workflows aw
            INNER JOIN users u ON aw.approver_id = u.id
            INNER JOIN quotations q ON aw.quotation_id = q.id
            INNER JOIN rfqs r ON q.rfq_id = r.id
            LEFT JOIN vendor_details vd ON q.vendor_id = vd.user_id
        `;
        const params = [];
        const conditions = [];

        if (action) {
            conditions.push("aw.action = ?");
            params.push(action);
        }
        if (approver_id) {
            conditions.push("aw.approver_id = ?");
            params.push(parseInt(approver_id, 10));
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY aw.id DESC";

        const [rows] = await db.query(query, params);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error in listApprovals:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    createApproval,
    approveQuotation,
    rejectQuotation,
    getApprovalById,
    listApprovals
};


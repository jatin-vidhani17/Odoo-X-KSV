const db = require('../config/db');

// 1. Create Invoice
const createInvoice = async (req, res) => {
    try {
        let { po_id, invoice_number, subtotal_amount, tax_amount } = req.body;

        if (!po_id) {
            return res.status(400).json({ success: false, message: "PO ID is required" });
        }

        // Generate Invoice number if not provided
        if (!invoice_number) {
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            invoice_number = `INV-${dateStr}-${randomSuffix}`;
        }

        // If subtotal amount is not provided, fetch from Purchase Order
        if (subtotal_amount === undefined || subtotal_amount === null) {
            const [poRows] = await db.query(
                "SELECT total_amount FROM purchase_orders WHERE id = ?",
                [po_id]
            );
            if (poRows.length === 0) {
                return res.status(404).json({ success: false, message: "Associated Purchase Order not found" });
            }
            subtotal_amount = poRows[0].total_amount;
        }

        if (tax_amount === undefined || tax_amount === null) {
            tax_amount = 0.00;
        }

        const query = `
            INSERT INTO invoices (po_id, invoice_number, subtotal_amount, tax_amount, status)
            VALUES (?, ?, ?, ?, 'Unpaid')
        `;
        const [result] = await db.query(query, [po_id, invoice_number, subtotal_amount, tax_amount]);

        // Create activity log
        await db.query(
            "INSERT INTO activity_logs (activity_type, log_summary) VALUES ('Invoice Generation', ?)",
            [`Generated invoice ${invoice_number} for PO ID ${po_id}`]
        );

        return res.status(201).json({
            success: true,
            message: "Invoice created successfully",
            data: { invoice_id: result.insertId, invoice_number, subtotal_amount, tax_amount }
        });
    } catch (error) {
        console.error("Error in createInvoice:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 2. Get All Invoices
const getAllInvoices = async (req, res) => {
    try {
        const query = `
            SELECT inv.*, po.po_number, q.rfq_id, r.title AS rfq_title, u.name AS vendor_name, vd.company_name
            FROM invoices inv
            INNER JOIN purchase_orders po ON inv.po_id = po.id
            INNER JOIN quotations q ON po.quotation_id = q.id
            INNER JOIN rfqs r ON q.rfq_id = r.id
            INNER JOIN users u ON q.vendor_id = u.id
            LEFT JOIN vendor_details vd ON u.id = vd.user_id
            ORDER BY inv.id DESC
        `;
        const [rows] = await db.query(query);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error in getAllInvoices:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 3. Get Invoice by ID
const getInvoiceById = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid Invoice ID format" });
        }

        const query = `
            SELECT inv.*, po.po_number, po.status AS po_status, q.rfq_id, q.vendor_id, 
                   r.title AS rfq_title, u.name AS vendor_name, u.email AS vendor_email, 
                   vd.company_name, vd.gst_number, vd.address AS vendor_address
            FROM invoices inv
            INNER JOIN purchase_orders po ON inv.po_id = po.id
            INNER JOIN quotations q ON po.quotation_id = q.id
            INNER JOIN rfqs r ON q.rfq_id = r.id
            INNER JOIN users u ON q.vendor_id = u.id
            LEFT JOIN vendor_details vd ON u.id = vd.user_id
            WHERE inv.id = ?
        `;

        const [rows] = await db.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Invoice not found" });
        }

        const invoice = rows[0];

        // Fetch Items
        const [items] = await db.query(
            `SELECT qi.*, ri.item_name, ri.unit
             FROM quotation_items qi
             INNER JOIN rfq_items ri ON qi.rfq_item_id = ri.id
             INNER JOIN purchase_orders po ON po.quotation_id = qi.quotation_id
             WHERE po.id = ?`,
            [invoice.po_id]
        );

        invoice.items = items;

        return res.status(200).json({ success: true, data: invoice });
    } catch (error) {
        console.error("Error in getInvoiceById:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 4. Pay Invoice (Transition to Paid and PO to Completed)
const payInvoice = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid Invoice ID format" });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Fetch invoice record to get PO ID
            const [invRows] = await connection.query(
                "SELECT po_id, invoice_number FROM invoices WHERE id = ?",
                [id]
            );

            if (invRows.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ success: false, message: "Invoice not found" });
            }

            const { po_id, invoice_number } = invRows[0];

            // 1. Update invoice status to 'Paid'
            await connection.query(
                "UPDATE invoices SET status = 'Paid' WHERE id = ?",
                [id]
            );

            // 2. Update purchase order status to 'Completed'
            await connection.query(
                "UPDATE purchase_orders SET status = 'Completed' WHERE id = ?",
                [po_id]
            );

            // 3. Log Activity
            await connection.query(
                "INSERT INTO activity_logs (activity_type, log_summary) VALUES ('Invoice Payment', ?)",
                [`Processed payment for invoice ${invoice_number} (PO ID ${po_id})`]
            );

            await connection.commit();
            return res.status(200).json({ success: true, message: "Payment processed successfully. Invoice paid and PO completed." });

        } catch (err) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: err.message });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error in payInvoice:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 5. Get Invoice PDF (HTML Simulation)
const getInvoicePDF = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid Invoice ID format" });
        }

        const query = `
            SELECT inv.*, po.po_number, r.title AS rfq_title, u.name AS vendor_name, vd.company_name, vd.gst_number
            FROM invoices inv
            INNER JOIN purchase_orders po ON inv.po_id = po.id
            INNER JOIN quotations q ON po.quotation_id = q.id
            INNER JOIN rfqs r ON q.rfq_id = r.id
            INNER JOIN users u ON q.vendor_id = u.id
            LEFT JOIN vendor_details vd ON u.id = vd.user_id
            WHERE inv.id = ?
        `;

        const [rows] = await db.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Invoice not found" });
        }

        const invoice = rows[0];

        const [items] = await db.query(
            `SELECT qi.*, ri.item_name, ri.unit
             FROM quotation_items qi
             INNER JOIN rfq_items ri ON qi.rfq_item_id = ri.id
             INNER JOIN purchase_orders po ON po.quotation_id = qi.quotation_id
             WHERE po.id = ?`,
            [invoice.po_id]
        );

        const itemsHtml = items.map((item, index) => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${index + 1}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.item_name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${item.quantity_bidded} ${item.unit}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${parseFloat(item.unit_price).toFixed(2)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${item.gst_percentage}%</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${parseFloat(item.net_price_with_gst).toFixed(2)}</td>
            </tr>
        `).join("");

        const pdfHtml = `
            <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: auto; border: 1px solid #eee;">
                <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #10b981; padding-bottom: 20px;">
                    <div>
                        <h1 style="margin: 0; color: #10b981;">VendorBridge ERP</h1>
                        <p style="margin: 5px 0 0 0; color: #666;">Tax Invoice</p>
                    </div>
                    <div style="text-align: right;">
                        <h2 style="margin: 0; color: #666;">${invoice.invoice_number}</h2>
                        <p style="margin: 5px 0 0 0;">Date: ${new Date(invoice.issued_at).toLocaleDateString()}</p>
                        <span style="display: inline-block; padding: 5px 10px; background: #ecfdf5; color: #047857; border-radius: 4px; font-weight: bold; margin-top: 5px;">${invoice.status}</span>
                    </div>
                </div>
                <div style="margin: 30px 0; display: flex; justify-content: space-between;">
                    <div>
                        <h4 style="margin: 0 0 10px 0; color: #10b981;">FROM (VENDOR):</h4>
                        <p style="margin: 0;"><strong>${invoice.company_name || invoice.vendor_name}</strong></p>
                        <p style="margin: 5px 0;">GSTIN: ${invoice.gst_number || "N/A"}</p>
                    </div>
                    <div style="text-align: right;">
                        <h4 style="margin: 0 0 10px 0; color: #10b981;">BILL TO / PO REF:</h4>
                        <p style="margin: 0;">PO Number: ${invoice.po_number}</p>
                        <p style="margin: 5px 0;">RFQ Title: ${invoice.rfq_title}</p>
                    </div>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">#</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item Description</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Qty</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Unit Price</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">GST</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                <div style="margin-top: 30px; text-align: right; line-height: 1.6;">
                    <p style="margin: 0;">Subtotal: $${parseFloat(invoice.subtotal_amount).toFixed(2)}</p>
                    <p style="margin: 5px 0 0 0;">Tax: $${parseFloat(invoice.tax_amount).toFixed(2)}</p>
                    <hr style="margin: 10px 0; border: none; border-top: 1px solid #ddd; display: inline-block; width: 200px;">
                    <h3 style="margin: 0;">Grand Total: <span style="color: #10b981;">$${parseFloat(invoice.total_amount).toFixed(2)}</span></h3>
                </div>
                <div style="margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
                    Thank you for your business! Please settle unpaid invoices within the agreed payment terms.
                </div>
            </div>
        `;

        return res.status(200).json({
            success: true,
            meta: {
                invoice_number: invoice.invoice_number,
                total_amount: invoice.total_amount,
                status: invoice.status,
                issued_at: invoice.issued_at
            },
            pdf_html: pdfHtml
        });
    } catch (error) {
        console.error("Error in getInvoicePDF:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 6. Send Invoice Email (Mock)
const emailInvoice = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { email_address } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid Invoice ID format" });
        }

        const [rows] = await db.query(
            `SELECT inv.invoice_number, u.email AS vendor_email, u.name AS vendor_name
             FROM invoices inv
             INNER JOIN purchase_orders po ON inv.po_id = po.id
             INNER JOIN quotations q ON po.quotation_id = q.id
             INNER JOIN users u ON q.vendor_id = u.id
             WHERE inv.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Invoice not found" });
        }

        const invoice = rows[0];
        const targetEmail = email_address || invoice.vendor_email || "procurement@vendorbridge.com";

        // Create log entry for activity
        await db.query(
            "INSERT INTO activity_logs (activity_type, log_summary) VALUES ('Invoice Dispatch', ?)",
            [`Dispatched invoice ${invoice.invoice_number} via email to ${targetEmail}`]
        );

        return res.status(200).json({
            success: true,
            message: `Invoice ${invoice.invoice_number} successfully emailed to ${targetEmail} (Simulated)`
        });
    } catch (error) {
        console.error("Error in emailInvoice:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    createInvoice,
    getAllInvoices,
    getInvoiceById,
    payInvoice,
    getInvoicePDF,
    emailInvoice
};

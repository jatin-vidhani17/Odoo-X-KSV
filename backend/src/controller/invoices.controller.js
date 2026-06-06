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
            SELECT inv.*, po.po_number, q.rfq_id, q.vendor_id, r.title AS rfq_title, u.name AS vendor_name, vd.company_name
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

        // Helper to convert number to words (simple implementation for mockup)
        const amountInWords = (amount) => {
            return "Amount in words would be written here. (Generated computationally)"; // Mocked for simplicity in this template
        };

        const itemsHtml = items.map((item, index) => {
            const unitPrice = parseFloat(item.unit_price);
            const qty = parseFloat(item.quantity_bidded);
            const netAmount = unitPrice * qty;
            const taxRate = parseFloat(item.gst_percentage);
            const taxAmount = (netAmount * taxRate) / 100;
            const totalAmount = netAmount + taxAmount;
            
            return `
            <tr>
                <td style="padding: 5px; border: 1px solid #333; text-align: center;">${index + 1}</td>
                <td style="padding: 5px; border: 1px solid #333;">${item.item_name}<br>
                    <span style="font-size: 10px;">HSN: 8471 (Mock)</span>
                </td>
                <td style="padding: 5px; border: 1px solid #333; text-align: right;">₹${unitPrice.toFixed(2)}</td>
                <td style="padding: 5px; border: 1px solid #333; text-align: center;">${qty}</td>
                <td style="padding: 5px; border: 1px solid #333; text-align: right;">₹${netAmount.toFixed(2)}</td>
                <td style="padding: 5px; border: 1px solid #333; text-align: center;">${(taxRate / 2).toFixed(1)}%<br>${(taxRate / 2).toFixed(1)}%</td>
                <td style="padding: 5px; border: 1px solid #333; text-align: center;">CGST<br>SGST</td>
                <td style="padding: 5px; border: 1px solid #333; text-align: right;">₹${(taxAmount / 2).toFixed(2)}<br>₹${(taxAmount / 2).toFixed(2)}</td>
                <td style="padding: 5px; border: 1px solid #333; text-align: right;">₹${totalAmount.toFixed(2)}</td>
            </tr>
            `;
        }).join("");

        const pdfHtml = `
            <div style="font-family: Arial, sans-serif; padding: 40px; color: #000; background-color: white; max-width: 800px; margin: auto; border: 1px solid #eee; font-size: 13px;">
                <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
                    <div>
                        <h1 style="margin: 0; font-size: 28px; letter-spacing: -1px;">VendorBridge</h1>
                        <div style="width: 100px; height: 3px; background-color: #ff9900; margin-top: 2px; border-radius: 50% 50% 0 0;"></div>
                    </div>
                    <div style="text-align: right;">
                        <h3 style="margin: 0; font-size: 16px;">Tax Invoice/Bill of Supply/Cash Memo</h3>
                        <p style="margin: 5px 0 0 0;">(Original for Recipient)</p>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <div style="width: 48%;">
                        <p style="margin: 0 0 5px 0;"><strong>Sold By :</strong></p>
                        <p style="margin: 0; line-height: 1.4;">${invoice.company_name || invoice.vendor_name}<br>
                            123 Vendor Industrial Park, Main Road,<br>
                            Tech District, Mumbai, 400001<br>
                            IN
                        </p>
                    </div>
                    <div style="width: 48%; text-align: right;">
                        <p style="margin: 0 0 5px 0;"><strong>Billing Address :</strong></p>
                        <p style="margin: 0; line-height: 1.4;">
                            VendorBridge Procurement Dept<br>
                            VendorBridge Inc, 10th floor Rain<br>
                            Tree Place, No 7, McNichols Road<br>
                            CHENNAI, TAMIL NADU, 600031<br>
                            IN
                        </p>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <div style="width: 48%;">
                        <p style="margin: 0 0 5px 0;"><strong>PAN No:</strong> ABCDE1234F</p>
                        <p style="margin: 0;"><strong>GST Registration No:</strong>${invoice.gst_number || "33ABCDE1234F1Z5"}</p>
                    </div>
                    <div style="width: 48%; text-align: right;">
                        <p style="margin: 0 0 5px 0;"><strong>Shipping Address :</strong></p>
                        <p style="margin: 0; line-height: 1.4;">
                            VendorBridge Procurement Dept<br>
                            VendorBridge Inc, 10th floor Rain<br>
                            Tree Place, No 7, McNichols Road<br>
                            CHENNAI, TAMIL NADU, 600031<br>
                            IN
                        </p>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <div style="width: 48%;">
                        <p style="margin: 0 0 5px 0;"><strong>Order Number:</strong>${invoice.po_number}</p>
                        <p style="margin: 0;"><strong>Order Date:</strong>${new Date().toLocaleDateString('en-GB').replace(/\//g, '.')}</p>
                    </div>
                    <div style="width: 48%; text-align: right;">
                        <p style="margin: 0 0 5px 0;"><strong>Invoice Number :</strong>${invoice.invoice_number}</p>
                        <p style="margin: 0 0 5px 0;"><strong>Invoice Details :</strong> TN-MAA4-${Math.floor(Math.random() * 10000)}</p>
                        <p style="margin: 0;"><strong>Invoice Date :</strong>${new Date(invoice.issued_at).toLocaleDateString('en-GB').replace(/\//g, '.')}</p>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
                    <thead>
                        <tr style="background-color: #f9f9f9;">
                            <th style="padding: 5px; border: 1px solid #333; text-align: center; width: 5%;">Sl.<br>No</th>
                            <th style="padding: 5px; border: 1px solid #333; text-align: left; width: 35%;">Description</th>
                            <th style="padding: 5px; border: 1px solid #333; text-align: right;">Unit Price</th>
                            <th style="padding: 5px; border: 1px solid #333; text-align: center;">Qty</th>
                            <th style="padding: 5px; border: 1px solid #333; text-align: right;">Net<br>Amount</th>
                            <th style="padding: 5px; border: 1px solid #333; text-align: center;">Tax<br>Rate</th>
                            <th style="padding: 5px; border: 1px solid #333; text-align: center;">Tax<br>Type</th>
                            <th style="padding: 5px; border: 1px solid #333; text-align: right;">Tax<br>Amount</th>
                            <th style="padding: 5px; border: 1px solid #333; text-align: right;">Total<br>Amount</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHtml}
                        <tr>
                            <td colspan="8" style="padding: 5px; border: 1px solid #333; text-align: left;"><strong>TOTAL:</strong></td>
                            <td style="padding: 5px; border: 1px solid #333; text-align: right;"><strong>₹${parseFloat(invoice.total_amount).toFixed(2)}</strong></td>
                        </tr>
                    </tbody>
                </table>

                <div style="border: 1px solid #333; border-top: none; padding: 5px; margin-bottom: 20px;">
                    <p style="margin: 0 0 5px 0;"><strong>Amount in Words:</strong></p>
                    <p style="margin: 0;"><strong>Rupees ${parseFloat(invoice.total_amount).toFixed(2)} Only</strong></p>
                </div>

                <div style="display: flex; justify-content: flex-end;">
                    <div style="text-align: right; width: 300px;">
                        <p style="margin: 0 0 10px 0;"><strong>For ${invoice.company_name || invoice.vendor_name}:</strong></p>
                        <div style="height: 40px; margin-bottom: 5px; display: flex; align-items: center; justify-content: flex-end;">
                            <span style="font-family: 'Brush Script MT', cursive; font-size: 24px; color: #000; padding-right: 20px;">Authorized</span>
                        </div>
                        <p style="margin: 0;"><strong>Authorized Signatory</strong></p>
                    </div>
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

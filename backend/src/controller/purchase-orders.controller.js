const db = require('../config/db');

// 1. Create Purchase Order
const createPurchaseOrder = async (req, res) => {
    try {
        let { quotation_id, po_number, total_amount } = req.body;

        if (!quotation_id) {
            return res.status(400).json({ success: false, message: "Quotation ID is required" });
        }

        // Generate PO number if not provided
        if (!po_number) {
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            po_number = `PO-${dateStr}-${randomSuffix}`;
        }

        // Calculate total amount if not provided
        if (total_amount === undefined || total_amount === null) {
            const [sumResult] = await db.query(
                "SELECT SUM(net_price_with_gst) AS total FROM quotation_items WHERE quotation_id = ?",
                [quotation_id]
            );
            total_amount = sumResult[0].total || 0.00;
        }

        const query = `
            INSERT INTO purchase_orders (po_number, quotation_id, total_amount, status)
            VALUES (?, ?, ?, 'Issued')
        `;
        const [result] = await db.query(query, [po_number, quotation_id, total_amount]);

        return res.status(201).json({
            success: true,
            message: "Purchase Order created successfully",
            data: { po_id: result.insertId, po_number, total_amount }
        });
    } catch (error) {
        console.error("Error in createPurchaseOrder:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 2. Get All Purchase Orders
const getAllPurchaseOrders = async (req, res) => {
    try {
        const query = `
            SELECT po.*, q.rfq_id, r.title AS rfq_title, u.name AS vendor_name, vd.company_name
            FROM purchase_orders po
            INNER JOIN quotations q ON po.quotation_id = q.id
            INNER JOIN rfqs r ON q.rfq_id = r.id
            INNER JOIN users u ON q.vendor_id = u.id
            LEFT JOIN vendor_details vd ON u.id = vd.user_id
            ORDER BY po.id DESC
        `;
        const [rows] = await db.query(query);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error in getAllPurchaseOrders:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 3. Get Purchase Order by ID
const getPurchaseOrderById = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid PO ID format" });
        }

        const query = `
            SELECT po.*, q.rfq_id, q.vendor_id, r.title AS rfq_title, r.description AS rfq_desc, 
                   u.name AS vendor_name, u.email AS vendor_email, u.phone AS vendor_phone, 
                   vd.company_name, vd.gst_number, vd.address AS vendor_address
            FROM purchase_orders po
            INNER JOIN quotations q ON po.quotation_id = q.id
            INNER JOIN rfqs r ON q.rfq_id = r.id
            INNER JOIN users u ON q.vendor_id = u.id
            LEFT JOIN vendor_details vd ON u.id = vd.user_id
            WHERE po.id = ?
        `;

        const [rows] = await db.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Purchase Order not found" });
        }

        const po = rows[0];

        // Fetch Items
        const [items] = await db.query(
            `SELECT qi.*, ri.item_name, ri.unit
             FROM quotation_items qi
             INNER JOIN rfq_items ri ON qi.rfq_item_id = ri.id
             WHERE qi.quotation_id = ?`,
            [po.quotation_id]
        );

        po.items = items;

        return res.status(200).json({ success: true, data: po });
    } catch (error) {
        console.error("Error in getPurchaseOrderById:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 4. Update PO Status
const updatePOStatus = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { status } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid PO ID format" });
        }
        if (!status) {
            return res.status(400).json({ success: false, message: "Status is required" });
        }

        const [result] = await db.query(
            "UPDATE purchase_orders SET status = ? WHERE id = ?",
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Purchase Order not found" });
        }

        return res.status(200).json({ success: true, message: `PO status updated to ${status}` });
    } catch (error) {
        console.error("Error in updatePOStatus:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 5. Get PO PDF (HTML Representation/Mock Download)
const getPOPDF = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid PO ID format" });
        }

        const query = `
            SELECT po.*, q.vendor_id, r.title AS rfq_title, u.name AS vendor_name, vd.company_name, vd.gst_number
            FROM purchase_orders po
            INNER JOIN quotations q ON po.quotation_id = q.id
            INNER JOIN rfqs r ON q.rfq_id = r.id
            INNER JOIN users u ON q.vendor_id = u.id
            LEFT JOIN vendor_details vd ON u.id = vd.user_id
            WHERE po.id = ?
        `;

        const [rows] = await db.query(query, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Purchase Order not found" });
        }

        const po = rows[0];

        const [items] = await db.query(
            `SELECT qi.*, ri.item_name, ri.unit
             FROM quotation_items qi
             INNER JOIN rfq_items ri ON qi.rfq_item_id = ri.id
             WHERE qi.quotation_id = ?`,
            [po.quotation_id]
        );

        // Build premium simulated HTML print invoice
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
                <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px;">
                    <div>
                        <h1 style="margin: 0; color: #1e3a8a;">VendorBridge ERP</h1>
                        <p style="margin: 5px 0 0 0; color: #666;">Official Purchase Order</p>
                    </div>
                    <div style="text-align: right;">
                        <h2 style="margin: 0; color: #666;">${po.po_number}</h2>
                        <p style="margin: 5px 0 0 0;">Date: ${new Date(po.created_at).toLocaleDateString()}</p>
                        <span style="display: inline-block; padding: 5px 10px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-weight: bold; margin-top: 5px;">${po.status}</span>
                    </div>
                </div>
                <div style="margin: 30px 0; display: flex; justify-content: space-between;">
                    <div>
                        <h4 style="margin: 0 0 10px 0; color: #1e3a8a;">ISSUED TO:</h4>
                        <p style="margin: 0;"><strong>${po.company_name || po.vendor_name}</strong></p>
                        <p style="margin: 5px 0;">GSTIN: ${po.gst_number || "N/A"}</p>
                        <p style="margin: 5px 0;">Vendor ID: ${po.vendor_id}</p>
                    </div>
                    <div style="text-align: right;">
                        <h4 style="margin: 0 0 10px 0; color: #1e3a8a;">RFQ REFERENCE:</h4>
                        <p style="margin: 0;">RFQ ID: ${po.rfq_id}</p>
                        <p style="margin: 5px 0;">Title: ${po.rfq_title}</p>
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
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Net Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                <div style="margin-top: 30px; text-align: right;">
                    <h3 style="margin: 0;">Total Amount: <span style="color: #1e3a8a;">$${parseFloat(po.total_amount).toFixed(2)}</span></h3>
                </div>
                <div style="margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
                    This is an electronically generated Purchase Order by VendorBridge ERP and does not require a physical signature.
                </div>
            </div>
        `;

        return res.status(200).json({
            success: true,
            meta: {
                po_number: po.po_number,
                total_amount: po.total_amount,
                vendor_name: po.vendor_name,
                company_name: po.company_name,
                created_at: po.created_at
            },
            pdf_html: pdfHtml
        });
    } catch (error) {
        console.error("Error in getPOPDF:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    createPurchaseOrder,
    getAllPurchaseOrders,
    getPurchaseOrderById,
    updatePOStatus,
    getPOPDF
};

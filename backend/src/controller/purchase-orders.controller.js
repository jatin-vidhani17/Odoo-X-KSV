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
            SELECT po.*, q.rfq_id, q.vendor_id, r.title AS rfq_title, u.name AS vendor_name, vd.company_name
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
        // Build premium simulated HTML print invoice based on GimBooks format
        const itemsHtml = items.map((item, index) => `
            <tr>
                <td style="padding: 10px; border-right: 1px solid #00b050; border-bottom: 1px solid #eee;">[${item.rfq_item_id || item.id}]</td>
                <td style="padding: 10px; border-right: 1px solid #00b050; border-bottom: 1px solid #eee;">${item.item_name}</td>
                <td style="padding: 10px; text-align: center; border-right: 1px solid #00b050; border-bottom: 1px solid #eee;">${item.quantity_bidded}</td>
                <td style="padding: 10px; text-align: right; border-right: 1px solid #00b050; border-bottom: 1px solid #eee;">${parseFloat(item.unit_price).toFixed(2)}</td>
                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${parseFloat(item.net_price_with_gst).toFixed(2)}</td>
            </tr>
        `).join("");

        // Calculate Subtotal (total amount without tax) for the bottom table
        const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.unit_price) * parseFloat(item.quantity_bidded)), 0).toFixed(2);
        const tax = items.reduce((acc, item) => acc + (parseFloat(item.net_price_with_gst) - (parseFloat(item.unit_price) * parseFloat(item.quantity_bidded))), 0).toFixed(2);

        const pdfHtml = `
            <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; background-color: white; max-width: 800px; margin: auto; border: 2px solid #00b050;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                            <div style="width: 50px; height: 50px; background-color: #ffd966; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <div style="width: 24px; height: 30px; background-color: white; border: 1px solid #ccc; position: relative;">
                                    <div style="position: absolute; top: 5px; left: 4px; right: 4px; height: 2px; background-color: #4285f4;"></div>
                                    <div style="position: absolute; top: 10px; left: 4px; right: 4px; height: 2px; background-color: #ccc;"></div>
                                </div>
                            </div>
                            <div>
                                <h2 style="margin: 0; color: #db4437; font-size: 24px; display: inline;">Vendor</h2><h2 style="margin: 0; color: #00b050; font-size: 24px; display: inline;">Bridge</h2>
                                <h3 style="margin: 0; color: #00b050; font-weight: normal;">VendorBridge</h3>
                            </div>
                        </div>
                        <div style="font-size: 12px; line-height: 1.4;">
                            [123 Enterprise Way]<br>
                            [Tech District, NY 10001]<br>
                            Phone: (800) 555-0199<br>
                            Fax: (800) 555-0198<br>
                            Website: www.vendorbridge.com
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <h1 style="margin: 0; color: #00b050; font-size: 36px; text-transform: uppercase;">Purchase Order</h1>
                        <table style="margin-top: 20px; float: right; font-size: 14px;">
                            <tr>
                                <td style="text-align: right; padding-right: 15px;">DATE</td>
                                <td>${new Date(po.created_at).toLocaleDateString('en-GB').replace(/\//g, '-')}</td>
                            </tr>
                            <tr>
                                <td style="text-align: right; padding-right: 15px;">PO #</td>
                                <td>[${po.po_number}]</td>
                            </tr>
                        </table>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <div style="width: 48%;">
                        <div style="background-color: #00b050; color: white; padding: 5px 10px; font-weight: bold; font-size: 14px;">VENDOR</div>
                        <div style="padding: 10px 0; font-size: 12px; line-height: 1.4;">
                            [${po.company_name || po.vendor_name}]<br>
                            [${po.vendor_email}]<br>
                            [${po.vendor_address || 'Address Line 1'}]<br>
                            [City, ST ZIP]<br>
                            Phone: [${po.vendor_phone || '(000) 000-0000'}]<br>
                            Fax: [(000) 000-0000]
                        </div>
                    </div>
                    <div style="width: 48%;">
                        <div style="background-color: #00b050; color: white; padding: 5px 10px; font-weight: bold; font-size: 14px;">SHIP TO</div>
                        <div style="padding: 10px 0; font-size: 12px; line-height: 1.4;">
                            [Receiving Department]<br>
                            [VendorBridge Inc]<br>
                            [123 Enterprise Way]<br>
                            [Tech District, NY 10001]<br>
                            [(800) 555-0199]
                        </div>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; text-align: center; font-size: 12px; border: 1px solid #00b050;">
                    <tr style="background-color: #00b050; color: white;">
                        <th style="padding: 5px; border-right: 1px solid white;">REQUISITIONER</th>
                        <th style="padding: 5px; border-right: 1px solid white;">SHIP VIA</th>
                        <th style="padding: 5px; border-right: 1px solid white;">F.O.B.</th>
                        <th style="padding: 5px;">SHIPPING TERMS</th>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-right: 1px solid #00b050;">Procurement Team</td>
                        <td style="padding: 10px; border-right: 1px solid #00b050;">Standard</td>
                        <td style="padding: 10px; border-right: 1px solid #00b050;">Destination</td>
                        <td style="padding: 10px;">Net 30</td>
                    </tr>
                </table>

                <table style="width: 100%; border-collapse: collapse; border: 2px solid #00b050; font-size: 12px; min-height: 300px;">
                    <thead>
                        <tr style="background-color: #00b050; color: white;">
                            <th style="padding: 8px; text-align: left; border-right: 1px solid white;">ITEM #</th>
                            <th style="padding: 8px; text-align: left; border-right: 1px solid white;">DESCRIPTION</th>
                            <th style="padding: 8px; text-align: center; border-right: 1px solid white;">QTY</th>
                            <th style="padding: 8px; text-align: right; border-right: 1px solid white;">UNIT PRICE</th>
                            <th style="padding: 8px; text-align: right;">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody style="vertical-align: top;">${itemsHtml}
                        <tr>
                            <td style="height: 150px; border-right: 1px solid #00b050;"></td>
                            <td style="border-right: 1px solid #00b050;"></td>
                            <td style="border-right: 1px solid #00b050;"></td>
                            <td style="border-right: 1px solid #00b050;"></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>

                <div style="display: flex; justify-content: space-between; margin-top: -2px;">
                    <div style="width: 60%; margin-top: 10px;">
                        <div style="background-color: #00b050; padding: 5px 10px; font-weight: bold; font-size: 12px;">Comments or Special Instructions</div>
                        <div style="padding: 10px 0; font-size: 12px;">
                            Deliveries accepted Mon-Fri, 9AM-4PM.<br>
                            Please include PO Number on all shipping documents.
                        </div>
                    </div>
                    <div style="width: 38%;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                            <tr>
                                <td style="padding: 5px; text-align: left;">SUBTOTAL</td>
                                <td style="padding: 5px; text-align: right;">${subtotal}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px; text-align: left;">TAX</td>
                                <td style="padding: 5px; text-align: right;">${tax}</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px; text-align: left;">SHIPPING</td>
                                <td style="padding: 5px; text-align: right;">-</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px; text-align: left;">OTHER</td>
                                <td style="padding: 5px; text-align: right;">-</td>
                            </tr>
                            <tr style="background-color: #ffc000; font-weight: bold; font-size: 14px;">
                                <td style="padding: 8px; text-align: left;">TOTAL</td>
                                <td style="padding: 8px; text-align: right;">₹ &nbsp;&nbsp;&nbsp;&nbsp;${parseFloat(po.total_amount).toFixed(2)}</td>
                            </tr>
                        </table>
                    </div>
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

// 6. Send PO Email (Mock)
const emailPO = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { email_address } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid PO ID format" });
        }

        const [rows] = await db.query(
            `SELECT po.po_number, u.email AS vendor_email
             FROM purchase_orders po
             INNER JOIN quotations q ON po.quotation_id = q.id
             INNER JOIN users u ON q.vendor_id = u.id
             WHERE po.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Purchase Order not found" });
        }

        const po = rows[0];
        const targetEmail = email_address || po.vendor_email || "procurement@vendorbridge.com";

        // Create log entry for activity
        await db.query(
            "INSERT INTO activity_logs (activity_type, log_summary) VALUES ('PO Dispatch', ?)",
            [`Dispatched Purchase Order ${po.po_number} via email to ${targetEmail}`]
        );

        return res.status(200).json({
            success: true,
            message: `Purchase Order ${po.po_number} successfully emailed to ${targetEmail} (Simulated)`
        });
    } catch (error) {
        console.error("Error in emailPO:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    createPurchaseOrder,
    getAllPurchaseOrders,
    getPurchaseOrderById,
    updatePOStatus,
    getPOPDF,
    emailPO
};

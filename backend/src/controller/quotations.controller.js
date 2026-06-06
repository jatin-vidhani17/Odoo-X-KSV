const db = require('../config/db');

// 1. Create Quotation (with optional items)
const createQuotation = async (req, res) => {
    try {
        const { rfq_id, vendor_id, vendor_notes, items } = req.body;

        if (!rfq_id || !vendor_id) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Insert Quotation
            const [quoteResult] = await connection.query(
                "INSERT INTO quotations (rfq_id, vendor_id, vendor_notes) VALUES (?, ?, ?)",
                [rfq_id, vendor_id, vendor_notes || null]
            );

            const quotationId = quoteResult.insertId;

            // Insert Items if any
            if (items && Array.isArray(items) && items.length > 0) {
                for (const item of items) {
                    if (!item.rfq_item_id || !item.quantity_bidded || !item.unit_price || item.delivery_timeline_days === undefined) {
                        throw new Error("Invalid item structure. rfq_item_id, quantity_bidded, unit_price, and delivery_timeline_days are required.");
                    }
                    await connection.query(
                        `INSERT INTO quotation_items 
                            (quotation_id, rfq_item_id, quantity_bidded, unit_price, gst_percentage, delivery_timeline_days) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [quotationId, item.rfq_item_id, item.quantity_bidded, item.unit_price, item.gst_percentage || 0.00, item.delivery_timeline_days]
                    );
                }
            }

            await connection.commit();
            return res.status(201).json({
                success: true,
                message: "Quotation submitted successfully",
                data: { quotation_id: quotationId }
            });

        } catch (err) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: err.message });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error in createQuotation:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 2. Get All Quotations
const getAllQuotations = async (req, res) => {
    try {
        const query = `
            SELECT q.*, r.title AS rfq_title, u.name AS vendor_name, vd.company_name
            FROM quotations q
            INNER JOIN rfqs r ON q.rfq_id = r.id
            INNER JOIN users u ON q.vendor_id = u.id
            LEFT JOIN vendor_details vd ON u.id = vd.user_id
            ORDER BY q.id DESC
        `;
        const [rows] = await db.query(query);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error in getAllQuotations:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 3. Get Quotation by ID (including items)
const getQuotationById = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid Quotation ID format" });
        }

        const query = `
            SELECT q.*, r.title AS rfq_title, u.name AS vendor_name, vd.company_name
            FROM quotations q
            INNER JOIN rfqs r ON q.rfq_id = r.id
            INNER JOIN users u ON q.vendor_id = u.id
            LEFT JOIN vendor_details vd ON u.id = vd.user_id
            WHERE q.id = ?
        `;
        const [quoteRows] = await db.query(query, [id]);

        if (quoteRows.length === 0) {
            return res.status(404).json({ success: false, message: "Quotation not found" });
        }

        const quotation = quoteRows[0];

        // Fetch Items
        const [items] = await db.query(
            `SELECT qi.*, ri.item_name, ri.unit
             FROM quotation_items qi
             INNER JOIN rfq_items ri ON qi.rfq_item_id = ri.id
             WHERE qi.quotation_id = ?`,
            [id]
        );

        quotation.items = items;

        return res.status(200).json({ success: true, data: quotation });
    } catch (error) {
        console.error("Error in getQuotationById:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 4. Get Quotations by RFQ ID
const getQuotationsByRFQ = async (req, res) => {
    try {
        const rfqId = parseInt(req.params.rfqId, 10);
        if (isNaN(rfqId)) {
            return res.status(400).json({ success: false, message: "Invalid RFQ ID format" });
        }

        const query = `
            SELECT q.*, u.name AS vendor_name, vd.company_name
            FROM quotations q
            INNER JOIN users u ON q.vendor_id = u.id
            LEFT JOIN vendor_details vd ON u.id = vd.user_id
            WHERE q.rfq_id = ?
            ORDER BY q.id DESC
        `;
        const [rows] = await db.query(query, [rfqId]);

        // Fetch items for each quotation
        for (const quote of rows) {
            const [items] = await db.query(
                `SELECT qi.*, ri.item_name, ri.unit
                 FROM quotation_items qi
                 INNER JOIN rfq_items ri ON qi.rfq_item_id = ri.id
                 WHERE qi.quotation_id = ?`,
                [quote.id]
            );
            quote.items = items;
        }

        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error in getQuotationsByRFQ:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 5. Add Quotation Items
const addQuotationItems = async (req, res) => {
    try {
        const quotationId = parseInt(req.params.quotationId, 10);
        const { items } = req.body;

        if (isNaN(quotationId)) {
            return res.status(400).json({ success: false, message: "Invalid Quotation ID format" });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: "Items list is required" });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (const item of items) {
                if (!item.rfq_item_id || !item.quantity_bidded || !item.unit_price || item.delivery_timeline_days === undefined) {
                    throw new Error("Missing item parameters");
                }
                await connection.query(
                    `INSERT INTO quotation_items 
                        (quotation_id, rfq_item_id, quantity_bidded, unit_price, gst_percentage, delivery_timeline_days) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [quotationId, item.rfq_item_id, item.quantity_bidded, item.unit_price, item.gst_percentage || 0.00, item.delivery_timeline_days]
                );
            }
            await connection.commit();
            return res.status(201).json({ success: true, message: "Quotation items added successfully" });
        } catch (err) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: err.message });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error in addQuotationItems:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 6. Update Quotation Item (Direct)
const updateQuotationItem = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { quantity_bidded, unit_price, gst_percentage, delivery_timeline_days } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid item ID format" });
        }

        const query = `
            UPDATE quotation_items SET
                quantity_bidded = COALESCE(?, quantity_bidded),
                unit_price = COALESCE(?, unit_price),
                gst_percentage = COALESCE(?, gst_percentage),
                delivery_timeline_days = COALESCE(?, delivery_timeline_days)
            WHERE id = ?
        `;

        const [result] = await db.query(query, [quantity_bidded || null, unit_price || null, gst_percentage || null, delivery_timeline_days || null, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Quotation item not found" });
        }

        return res.status(200).json({ success: true, message: "Quotation item updated successfully" });
    } catch (error) {
        console.error("Error in updateQuotationItem:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 7. Delete Quotation Item (Direct)
const deleteQuotationItem = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid item ID format" });
        }

        const [result] = await db.query("DELETE FROM quotation_items WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Quotation item not found" });
        }

        return res.status(200).json({ success: true, message: "Quotation item deleted successfully" });
    } catch (error) {
        console.error("Error in deleteQuotationItem:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    createQuotation,
    getAllQuotations,
    getQuotationById,
    getQuotationsByRFQ,
    addQuotationItems,
    updateQuotationItem,
    deleteQuotationItem
};

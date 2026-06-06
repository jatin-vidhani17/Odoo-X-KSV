const db = require('../config/db');

// 1. Create RFQ (with optional items and vendors)
const createRFQ = async (req, res) => {
    try {
        const { title, description, category, deadline, created_by, attachment_url, items, vendor_ids } = req.body;

        if (!title || !category || !deadline || !created_by) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Insert RFQ
            const [rfqResult] = await connection.query(
                "INSERT INTO rfqs (title, description, category, deadline, attachment_url, created_by, status) VALUES (?, ?, ?, ?, ?, ?, 'Published')",
                [title, description || null, category, deadline, attachment_url || null, created_by]
            );

            const rfqId = rfqResult.insertId;

            // Insert Items if any
            if (items && Array.isArray(items) && items.length > 0) {
                for (const item of items) {
                    if (!item.item_name || !item.quantity || !item.unit) {
                        throw new Error("Invalid item structure. item_name, quantity, and unit are required.");
                    }
                    await connection.query(
                        "INSERT INTO rfq_items (rfq_id, item_name, quantity, unit) VALUES (?, ?, ?, ?)",
                        [rfqId, item.item_name, item.quantity, item.unit]
                    );
                }
            }

            // Assign Vendors if any
            if (vendor_ids && Array.isArray(vendor_ids) && vendor_ids.length > 0) {
                for (const vendorId of vendor_ids) {
                    await connection.query(
                        "INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES (?, ?)",
                        [rfqId, vendorId]
                    );
                }
            }

            await connection.commit();
            return res.status(201).json({
                success: true,
                message: "RFQ created successfully",
                data: { rfq_id: rfqId }
            });

        } catch (err) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: err.message });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error in createRFQ:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 2. Get All RFQs
const getAllRFQs = async (req, res) => {
    try {
        const query = `
            SELECT r.*, u.name AS creator_name 
            FROM rfqs r
            INNER JOIN users u ON r.created_by = u.id
            ORDER BY r.id DESC
        `;
        const [rows] = await db.query(query);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error in getAllRFQs:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 2.5 Get RFQs Assigned to a Vendor
const getRFQsByVendor = async (req, res) => {
    try {
        const vendorId = parseInt(req.params.vendorId, 10);
        if (isNaN(vendorId)) {
            return res.status(400).json({ success: false, message: "Invalid vendor ID" });
        }

        const query = `
            SELECT r.*, u.name AS creator_name 
            FROM rfqs r
            INNER JOIN rfq_vendors rv ON r.id = rv.rfq_id
            INNER JOIN users u ON r.created_by = u.id
            WHERE rv.vendor_id = ?
            ORDER BY r.id DESC
        `;
        const [rows] = await db.query(query, [vendorId]);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error in getRFQsByVendor:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 3. Get RFQ by ID (including items and vendors)
const getRFQById = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid RFQ ID format" });
        }

        const [rfqRows] = await db.query(
            "SELECT r.*, u.name AS creator_name FROM rfqs r INNER JOIN users u ON r.created_by = u.id WHERE r.id = ?",
            [id]
        );

        if (rfqRows.length === 0) {
            return res.status(404).json({ success: false, message: "RFQ not found" });
        }

        const rfq = rfqRows[0];

        // Fetch Items
        const [items] = await db.query("SELECT * FROM rfq_items WHERE rfq_id = ?", [id]);

        // Fetch Assigned Vendors
        const [vendors] = await db.query(
            `SELECT rv.vendor_id, u.name, u.email, vd.company_name 
             FROM rfq_vendors rv
             INNER JOIN users u ON rv.vendor_id = u.id
             LEFT JOIN vendor_details vd ON u.id = vd.user_id
             WHERE rv.rfq_id = ?`,
            [id]
        );

        rfq.items = items;
        rfq.vendors = vendors;

        return res.status(200).json({ success: true, data: rfq });
    } catch (error) {
        console.error("Error in getRFQById:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 4. Update RFQ Metadata
const updateRFQ = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid RFQ ID format" });
        }

        const { title, description, category, deadline, attachment_url, status } = req.body;

        const query = `
            UPDATE rfqs SET
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                category = COALESCE(?, category),
                deadline = COALESCE(?, deadline),
                attachment_url = COALESCE(?, attachment_url),
                status = COALESCE(?, status)
            WHERE id = ?
        `;

        const [result] = await db.query(query, [title || null, description || null, category || null, deadline || null, attachment_url || null, status || null, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "RFQ not found" });
        }

        return res.status(200).json({ success: true, message: "RFQ updated successfully" });
    } catch (error) {
        console.error("Error in updateRFQ:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 5. Delete RFQ
const deleteRFQ = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid RFQ ID format" });
        }

        const [result] = await db.query("DELETE FROM rfqs WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "RFQ not found" });
        }

        return res.status(200).json({ success: true, message: "RFQ deleted successfully" });
    } catch (error) {
        console.error("Error in deleteRFQ:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 6. Publish RFQ
const publishRFQ = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid RFQ ID format" });
        }

        const [result] = await db.query("UPDATE rfqs SET status = 'Published' WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "RFQ not found" });
        }

        return res.status(200).json({ success: true, message: "RFQ published successfully" });
    } catch (error) {
        console.error("Error in publishRFQ:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 7. Add RFQ Items
const addRFQItems = async (req, res) => {
    try {
        const rfqId = parseInt(req.params.rfqId, 10);
        const { items } = req.body;

        if (isNaN(rfqId)) {
            return res.status(400).json({ success: false, message: "Invalid RFQ ID format" });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: "Items list is required" });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (const item of items) {
                if (!item.item_name || !item.quantity || !item.unit) {
                    throw new Error("Missing item parameters");
                }
                await connection.query(
                    "INSERT INTO rfq_items (rfq_id, item_name, quantity, unit) VALUES (?, ?, ?, ?)",
                    [rfqId, item.item_name, item.quantity, item.unit]
                );
            }
            await connection.commit();
            return res.status(201).json({ success: true, message: "RFQ items added successfully" });
        } catch (err) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: err.message });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error in addRFQItems:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 8. Get RFQ Items
const getRFQItems = async (req, res) => {
    try {
        const rfqId = parseInt(req.params.rfqId, 10);
        if (isNaN(rfqId)) {
            return res.status(400).json({ success: false, message: "Invalid RFQ ID format" });
        }

        const [rows] = await db.query("SELECT * FROM rfq_items WHERE rfq_id = ?", [rfqId]);
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error in getRFQItems:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 9. Update RFQ Item (Direct)
const updateRFQItem = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { item_name, quantity, unit } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid item ID format" });
        }

        const query = `
            UPDATE rfq_items SET
                item_name = COALESCE(?, item_name),
                quantity = COALESCE(?, quantity),
                unit = COALESCE(?, unit)
            WHERE id = ?
        `;

        const [result] = await db.query(query, [item_name || null, quantity || null, unit || null, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "RFQ item not found" });
        }

        return res.status(200).json({ success: true, message: "RFQ item updated successfully" });
    } catch (error) {
        console.error("Error in updateRFQItem:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 10. Delete RFQ Item (Direct)
const deleteRFQItem = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid item ID format" });
        }

        const [result] = await db.query("DELETE FROM rfq_items WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "RFQ item not found" });
        }

        return res.status(200).json({ success: true, message: "RFQ item deleted successfully" });
    } catch (error) {
        console.error("Error in deleteRFQItem:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 11. Assign Vendors to RFQ
const assignRFQVendors = async (req, res) => {
    try {
        const rfqId = parseInt(req.params.rfqId, 10);
        const { vendor_ids } = req.body;

        if (isNaN(rfqId)) {
            return res.status(400).json({ success: false, message: "Invalid RFQ ID format" });
        }
        if (!vendor_ids || !Array.isArray(vendor_ids) || vendor_ids.length === 0) {
            return res.status(400).json({ success: false, message: "Vendor IDs list is required" });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (const vendorId of vendor_ids) {
                await connection.query(
                    "INSERT IGNORE INTO rfq_vendors (rfq_id, vendor_id) VALUES (?, ?)",
                    [rfqId, vendorId]
                );
            }
            await connection.commit();
            return res.status(201).json({ success: true, message: "Vendors assigned to RFQ successfully" });
        } catch (err) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: err.message });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error in assignRFQVendors:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 12. Get RFQ Assigned Vendors
const getRFQVendors = async (req, res) => {
    try {
        const rfqId = parseInt(req.params.rfqId, 10);
        if (isNaN(rfqId)) {
            return res.status(400).json({ success: false, message: "Invalid RFQ ID format" });
        }

        const [rows] = await db.query(
            `SELECT rv.vendor_id, u.name, u.email, vd.company_name, vd.gst_number, vd.category
             FROM rfq_vendors rv
             INNER JOIN users u ON rv.vendor_id = u.id
             LEFT JOIN vendor_details vd ON u.id = vd.user_id
             WHERE rv.rfq_id = ?`,
            [rfqId]
        );
        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error in getRFQVendors:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// 13. RFQ Comparison Matrix
const getRFQComparison = async (req, res) => {
    try {
        const rfqId = parseInt(req.params.rfqId, 10);
        if (isNaN(rfqId)) {
            return res.status(400).json({ success: false, message: "Invalid RFQ ID format" });
        }

        // Fetch RFQ Details
        const [rfqRows] = await db.query("SELECT * FROM rfqs WHERE id = ?", [rfqId]);
        if (rfqRows.length === 0) {
            return res.status(404).json({ success: false, message: "RFQ not found" });
        }

        // Fetch RFQ Items
        const [rfqItems] = await db.query("SELECT * FROM rfq_items WHERE rfq_id = ?", [rfqId]);

        // Fetch Quotations with their items and vendor details
        const [quotes] = await db.query(
            `SELECT q.*, u.name AS vendor_name, vd.company_name 
             FROM quotations q
             INNER JOIN users u ON q.vendor_id = u.id
             LEFT JOIN vendor_details vd ON u.id = vd.user_id
             WHERE q.rfq_id = ?`,
            [rfqId]
        );

        // Populate items for each quotation
        for (const quote of quotes) {
            const [quoteItems] = await db.query(
                `SELECT qi.*, ri.item_name 
                 FROM quotation_items qi
                 INNER JOIN rfq_items ri ON qi.rfq_item_id = ri.id
                 WHERE qi.quotation_id = ?`,
                [quote.id]
            );
            quote.items = quoteItems;
        }

        return res.status(200).json({
            success: true,
            data: {
                rfq: rfqRows[0],
                rfq_items: rfqItems,
                quotations: quotes
            }
        });
    } catch (error) {
        console.error("Error in getRFQComparison:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    createRFQ,
    getAllRFQs,
    getRFQsByVendor,
    getRFQById,
    updateRFQ,
    deleteRFQ,
    publishRFQ,
    addRFQItems,
    getRFQItems,
    updateRFQItem,
    deleteRFQItem,
    assignRFQVendors,
    getRFQVendors,
    getRFQComparison
};

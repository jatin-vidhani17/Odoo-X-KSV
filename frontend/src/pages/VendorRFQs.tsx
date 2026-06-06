import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { Send, Eye, X } from 'lucide-react';

const VendorRFQs = () => {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Bid states
  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [bidItems, setBidItems] = useState<any[]>([]);
  const [vendorNotes, setVendorNotes] = useState('');
  const [bidSubmitting, setBidSubmitting] = useState(false);

  const fetchRFQs = async () => {
    try {
      setLoading(true);
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const vendorId = user?.id || 11; // Fallback to 11

      const res = await apiFetch(`/rfqs/vendor/${vendorId}`);
      if (res.success && Array.isArray(res.data)) {
        // Vendors only see Published RFQs that are assigned to them
        const published = res.data.filter((r: any) => r.status === 'Published');
        setRfqs(published);
      }
    } catch (err: any) {
      console.error("Error loading RFQs for vendor:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, []);

  const handleOpenBid = async (rfqId: number) => {
    try {
      const res = await apiFetch(`/rfqs/${rfqId}`);
      if (res.success && res.data) {
        setSelectedRfq(res.data);
        // Initialize bidded items
        const initialBids = res.data.items.map((item: any) => ({
          rfq_item_id: item.id,
          item_name: item.item_name,
          quantity_bidded: item.quantity,
          unit: item.unit,
          unit_price: '',
          gst_percentage: 18.00, // Default 18% GST standard
          delivery_timeline_days: 7 // Default 7 days
        }));
        setBidItems(initialBids);
        setVendorNotes('');
      }
    } catch (err: any) {
      alert(`Failed to load RFQ items: ${err.message}`);
    }
  };

  const handleBidFieldChange = (index: number, field: string, value: any) => {
    const updated = [...bidItems];
    updated[index][field] = value;
    setBidItems(updated);
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfq) return;

    // Validate inputs
    for (const it of bidItems) {
      if (it.unit_price === '' || parseFloat(it.unit_price) <= 0) {
        alert("Please enter a valid unit price for all bidded items.");
        return;
      }
    }

    setBidSubmitting(true);
    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const vendorId = user?.id || 11; // Fallback to user ID 11

      const payload = {
        rfq_id: selectedRfq.id,
        vendor_id: vendorId,
        vendor_notes: vendorNotes,
        items: bidItems.map(it => ({
          rfq_item_id: it.rfq_item_id,
          quantity_bidded: it.quantity_bidded,
          unit_price: parseFloat(it.unit_price),
          gst_percentage: parseFloat(it.gst_percentage || 0),
          delivery_timeline_days: parseInt(it.delivery_timeline_days, 10) || 7
        }))
      };

      const res = await apiFetch('/quotations', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        // Log Activity
        await apiFetch('/activity-logs', {
          method: 'POST',
          body: JSON.stringify({
            activity_type: 'Quotation Submission',
            log_summary: `Vendor ${user?.name || 'Vendor'} submitted quotation for RFQ: ${selectedRfq.title}`
          })
        }).catch(() => { });

        alert("Quotation bid submitted successfully!");
        setSelectedRfq(null);
        fetchRFQs();
      }
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setBidSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Vendor RFQs Console</h1>
        <p className="text-muted">View open requests for quotations and submit bid responses</p>
      </div>

      {selectedRfq && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>Submit Quotation for: {selectedRfq.title}</h2>
            <button className="btn btn-outline" onClick={() => setSelectedRfq(null)}>
              <X size={16} /> Cancel
            </button>
          </div>

          <form onSubmit={handleSubmitBid}>
            <div className="table-container mb-4">
              <table style={{ border: '1px solid var(--border-color)' }}>
                <thead style={{ backgroundColor: 'var(--bg-input)' }}>
                  <tr>
                    <th>Item Description</th>
                    <th style={{ width: '100px' }}>Quantity</th>
                    <th style={{ width: '150px' }}>Unit Price *</th>
                    <th style={{ width: '120px' }}>GST %</th>
                    <th style={{ width: '140px' }}>Delivery Days *</th>
                  </tr>
                </thead>
                <tbody>
                  {bidItems.map((item, idx) => (
                    <tr key={item.rfq_item_id}>
                      <td className="font-bold">{item.item_name}</td>
                      <td>{item.quantity_bidded} {item.unit}</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          required
                          className="form-control"
                          placeholder="0.00"
                          value={item.unit_price}
                          onChange={(e) => handleBidFieldChange(idx, 'unit_price', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.1"
                          className="form-control"
                          value={item.gst_percentage}
                          onChange={(e) => handleBidFieldChange(idx, 'gst_percentage', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          required
                          className="form-control"
                          value={item.delivery_timeline_days}
                          onChange={(e) => handleBidFieldChange(idx, 'delivery_timeline_days', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="form-group">
              <label className="form-label">Vendor Response Notes (optional)</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Add warranty, logistics, or payment details..."
                value={vendorNotes}
                onChange={(e) => setVendorNotes(e.target.value)}
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary mt-4" disabled={bidSubmitting}>
              <Send size={16} /> {bidSubmitting ? "Submitting..." : "Submit Quotation Bid"}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="text-center p-8">Loading available RFQs...</div>
        ) : rfqs.length === 0 ? (
          <div className="text-center p-8 text-muted border" style={{ borderRadius: '6px' }}>
            No active published RFQs assigned to you at the moment.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>RFQ Title</th>
                  <th>Category</th>
                  <th>Deadline</th>
                  <th>Attachment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rfqs.map((rfq) => (
                  <tr key={rfq.id}>
                    <td className="font-bold">{rfq.title}</td>
                    <td>{rfq.category}</td>
                    <td>{new Date(rfq.deadline).toLocaleDateString()}</td>
                    <td>{rfq.attachment_url ? <a href={rfq.attachment_url} target="_blank" rel="noreferrer">Download</a> : 'None'}</td>
                    <td>
                      <button
                        className="btn btn-primary flex items-center gap-1"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                        onClick={() => handleOpenBid(rfq.id)}
                      >
                        <Eye size={14} /> Bid Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorRFQs;

import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { Eye, X } from 'lucide-react';

const VendorQuotations = () => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail modal state
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const vendorId = user?.id || 11; // Fallback to user ID 11

      const res = await apiFetch('/quotations');
      if (res.success && Array.isArray(res.data)) {
        // Filter quotations submitted by this vendor
        const myQuotes = res.data.filter((q: any) => q.vendor_id === vendorId);
        setQuotations(myQuotes);
      }
    } catch (err: any) {
      console.error("Error loading vendor quotations:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleOpenDetails = async (quoteId: number) => {
    try {
      setLoadingDetails(true);
      const res = await apiFetch(`/quotations/${quoteId}`);
      if (res.success && res.data) {
        setSelectedQuote(res.data);
      }
    } catch (err: any) {
      alert(`Failed to load quotation details: ${err.message}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  const calculateTotal = (quote: any) => {
    if (!quote || !quote.items) return 0;
    return quote.items.reduce((sum: number, it: any) => sum + parseFloat(it.net_price_with_gst || 0), 0);
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>My Quotation Bids</h1>
        <p className="text-muted">Track submission status, prices, and approval review feedback</p>
      </div>

      {selectedQuote && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>Quotation Detail: {selectedQuote.rfq_title}</h2>
            <button className="btn btn-outline" onClick={() => setSelectedQuote(null)}>
              <X size={16} /> Close Details
            </button>
          </div>

          {loadingDetails ? (
            <div>Loading bid items...</div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: '4px', fontSize: '0.9rem' }}>
                <div><strong>Submission Date:</strong> {new Date(selectedQuote.submitted_at).toLocaleString()}</div>
                <div><strong>Status:</strong> <span className={`badge ${
                  selectedQuote.status === 'Accepted' ? 'badge-success' : 
                  selectedQuote.status === 'Rejected' ? 'badge-danger' : 
                  'badge-info'
                }`}>{selectedQuote.status}</span></div>
                <div><strong>Notes:</strong> {selectedQuote.vendor_notes || 'None'}</div>
                <div><strong>Bid Total (incl. GST):</strong> ₹{calculateTotal(selectedQuote).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>

              <h3>Itemized Price Breakdown</h3>
              <div className="table-container">
                <table style={{ border: '1px solid var(--border-color)' }}>
                  <thead style={{ backgroundColor: 'var(--bg-input)' }}>
                    <tr>
                      <th>Item Description</th>
                      <th style={{ textAlign: 'right' }}>Quantity</th>
                      <th style={{ textAlign: 'right' }}>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>GST %</th>
                      <th style={{ textAlign: 'right' }}>Total (incl. GST)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedQuote.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="font-bold">{item.item_name}</td>
                        <td style={{ textAlign: 'right' }}>{item.quantity_bidded} {item.unit}</td>
                        <td style={{ textAlign: 'right' }}>₹{parseFloat(item.unit_price).toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>{parseFloat(item.gst_percentage).toFixed(1)}%</td>
                        <td style={{ textAlign: 'right' }}>₹{parseFloat(item.net_price_with_gst).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="text-center p-8">Loading quotations list...</div>
        ) : quotations.length === 0 ? (
          <div className="text-center p-8 text-muted border" style={{ borderRadius: '6px' }}>
            No quotation bids submitted yet. Invite an RFQ above to bid.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>RFQ Reference</th>
                  <th>Submitted At</th>
                  <th>Notes</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((quote) => (
                  <tr key={quote.id}>
                    <td className="font-bold">{quote.rfq_title}</td>
                    <td>{new Date(quote.submitted_at).toLocaleDateString()}</td>
                    <td>{quote.vendor_notes || 'None'}</td>
                    <td>
                      <span className={`badge ${
                        quote.status === 'Accepted' ? 'badge-success' : 
                        quote.status === 'Rejected' ? 'badge-danger' : 
                        'badge-info'
                      }`}>
                        {quote.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-outline flex items-center gap-1"
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                        onClick={() => handleOpenDetails(quote.id)}
                      >
                        <Eye size={14} /> View Items
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

export default VendorQuotations;

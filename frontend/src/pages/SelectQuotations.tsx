import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const SelectQuotations = () => {
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [selectedRfqId, setSelectedRfqId] = useState<number | ''>('');
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load RFQs
    apiFetch('/rfqs')
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setRfqs(res.data);
          if (res.data.length > 0) {
            setSelectedRfqId(res.data[0].id);
          }
        }
      })
      .catch(err => console.error("Error loading RFQs:", err.message));
  }, []);

  useEffect(() => {
    if (!selectedRfqId) return;

    const fetchQuotations = async () => {
      try {
        setLoading(true);
        // GET /api/rfqs/:rfqId/quotations
        const res = await apiFetch(`/rfqs/${selectedRfqId}/quotations`);
        if (res.success && Array.isArray(res.data)) {
          setQuotations(res.data);
        }
      } catch (err: any) {
        console.error("Error loading quotations:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotations();
  }, [selectedRfqId]);

  const handleCompare = () => {
    if (!selectedRfqId) return;
    if (quotations.length === 0) {
      alert("No quotations to compare yet.");
      return;
    }
    // Navigate passing the selected RFQ ID
    navigate(`/procurement/quotations/compare?rfqId=${selectedRfqId}`);
  };

  const calculateTotal = (quote: any) => {
    if (!quote.items || quote.items.length === 0) return 0;
    return quote.items.reduce((sum: number, item: any) => sum + parseFloat(item.net_price_with_gst || 0), 0);
  };

  const getDeliveryDays = (quote: any) => {
    if (!quote.items || quote.items.length === 0) return 'N/A';
    const maxDays = Math.max(...quote.items.map((item: any) => item.delivery_timeline_days || 0));
    return `${maxDays} Days`;
  };

  const selectedRfq = rfqs.find(r => r.id === selectedRfqId);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Select Quotations</h1>
        <p className="text-muted">
          {selectedRfq 
            ? `RFQ: ${selectedRfq.title} (Category: ${selectedRfq.category}) - Deadline: ${new Date(selectedRfq.deadline).toLocaleDateString()}` 
            : 'Select an RFQ to view received quotations'}
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ maxWidth: '400px' }}>
          <label className="form-label">Active RFQ Reference *</label>
          <select 
            className="form-control" 
            value={selectedRfqId} 
            onChange={(e) => setSelectedRfqId(parseInt(e.target.value, 10) || '')}
          >
            <option value="">Select RFQ...</option>
            {rfqs.map(r => (
              <option key={r.id} value={r.id}>{r.title} ({r.status})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4">Received Quotations</h2>
        
        {loading ? (
          <div className="text-center p-8">Loading quotations...</div>
        ) : !selectedRfqId ? (
          <div className="text-center p-8 text-muted">Please select an RFQ above.</div>
        ) : quotations.length === 0 ? (
          <div className="text-center p-8 text-muted border" style={{ borderRadius: '6px' }}>
            No quotations submitted by vendors yet for this RFQ.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Vendor / Company Name</th>
                  <th>Total Price (incl. GST)</th>
                  <th>Delivery Time</th>
                  <th>Notes</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((quote) => (
                  <tr key={quote.id}>
                    <td className="font-bold">{quote.company_name || quote.vendor_name}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                      ${calculateTotal(quote).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>{getDeliveryDays(quote)}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/procurement/rfqs/create')}>Create New RFQ</button>
          <button 
            type="button" 
            className="btn btn-primary" 
            disabled={quotations.length === 0} 
            onClick={handleCompare}
          >
            Compare Received Quotations
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectQuotations;

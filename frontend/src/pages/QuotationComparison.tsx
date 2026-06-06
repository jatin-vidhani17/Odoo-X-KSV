import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const QuotationComparison = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rfqId = searchParams.get('rfqId');
  
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState<any[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!rfqId) return;

    const loadComparison = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/rfqs/${rfqId}/comparison`);
        if (res.success && res.data) {
          setComparisonData(res.data);
        }

        // Also fetch managers to choose who to send the approval request to
        const usersRes = await apiFetch('/users');
        if (usersRes.success && Array.isArray(usersRes.data)) {
          const mgrList = usersRes.data.filter((u: any) => u.role === 'Manager');
          setManagers(mgrList);
          if (mgrList.length > 0) {
            setSelectedManagerId(mgrList[0].id);
          }
        }
      } catch (err: any) {
        console.error("Comparison load failed:", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadComparison();
  }, [rfqId]);

  const handleSelectQuote = async (quotationId: number) => {
    if (!selectedManagerId) {
      alert("Please select a Manager to send the approval request to.");
      return;
    }
    
    setSubmitting(true);
    try {
      // Create Approval Workflow: POST /api/approvals
      const res = await apiFetch('/approvals', {
        method: 'POST',
        body: JSON.stringify({
          quotation_id: quotationId,
          approver_id: selectedManagerId,
          remarks: `Initiated approval for quotation on RFQ: ${comparisonData.rfq.title}`
        })
      });

      if (res.success && res.data) {
        // Log Activity
        await apiFetch('/activity-logs', {
          method: 'POST',
          body: JSON.stringify({
            activity_type: 'Approval Requested',
            log_summary: `Requested approval for quotation ID ${quotationId} from Manager ID ${selectedManagerId}`
          })
        }).catch(() => {});

        // Navigate to approvals page passing the new approval ID
        navigate(`/procurement/approvals?approvalId=${res.data.approval_id}`);
      }
    } catch (err: any) {
      alert(`Failed to request approval: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading comparison matrix...</div>;
  }

  if (!comparisonData || !comparisonData.quotations || comparisonData.quotations.length === 0) {
    return (
      <div className="p-8 text-center text-muted">
        No quotation data found to compare. Please select an RFQ with submitted bids.
        <br /><br />
        <button className="btn btn-outline" onClick={() => navigate('/procurement/quotations/select')}>Back</button>
      </div>
    );
  }

  const { rfq, rfq_items, quotations } = comparisonData;

  const calculateTotal = (quote: any) => {
    if (!quote.items || quote.items.length === 0) return 0;
    return quote.items.reduce((sum: number, item: any) => sum + parseFloat(item.net_price_with_gst || 0), 0);
  };

  const getDeliveryDays = (quote: any) => {
    if (!quote.items || quote.items.length === 0) return 0;
    return Math.max(...quote.items.map((item: any) => item.delivery_timeline_days || 0));
  };

  // Find lowest price quote for recommendation
  const recommendedQuote = [...quotations].sort((a, b) => calculateTotal(a) - calculateTotal(b))[0];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Quotation Comparison Matrix</h1>
        <p className="text-muted">RFQ Reference: {rfq.title} ({rfq_items.length} items, {quotations.length} quotes received)</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', maxWidth: '500px' }}>
        <div className="form-group">
          <label className="form-label">Assign Manager for Approval *</label>
          <select 
            className="form-control" 
            value={selectedManagerId} 
            onChange={(e) => setSelectedManagerId(parseInt(e.target.value, 10) || '')}
          >
            {managers.length === 0 ? (
              <option value="">No Managers found in database (please create one)</option>
            ) : (
              managers.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table style={{ border: '1px solid var(--border-color)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-input)' }}>
                <th>Comparison Criteria</th>
                {quotations.map((quote: any) => {
                  const isRec = quote.id === recommendedQuote.id;
                  return (
                    <th 
                      key={quote.id} 
                      style={isRec ? { backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '2px solid var(--accent)' } : {}}
                    >
                      {quote.company_name || quote.vendor_name}
                      {isRec && <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--accent)' }}>(Recommended)</span>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold text-muted">Total Price (GST Incl.)</td>
                {quotations.map((quote: any) => (
                  <td key={quote.id} style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                    ${calculateTotal(quote).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="font-bold text-muted">Lead Time (Delivery)</td>
                {quotations.map((quote: any) => (
                  <td key={quote.id}>
                    {getDeliveryDays(quote)} Days
                  </td>
                ))}
              </tr>
              <tr>
                <td className="font-bold text-muted">Notes</td>
                {quotations.map((quote: any) => (
                  <td key={quote.id} style={{ fontSize: '0.85rem' }}>
                    {quote.vendor_notes || 'None'}
                  </td>
                ))}
              </tr>

              {/* Items Breakdown Section */}
              <tr style={{ backgroundColor: 'var(--bg-input)' }}>
                <td className="font-bold" style={{ color: 'var(--info)' }} colSpan={quotations.length + 1}>
                  Bidded Items Unit Price Breakdown
                </td>
              </tr>

              {rfq_items.map((rfqItem: any) => (
                <tr key={rfqItem.id}>
                  <td style={{ paddingLeft: '1.5rem' }}>
                    {rfqItem.item_name} ({rfqItem.quantity} {rfqItem.unit})
                  </td>
                  {quotations.map((quote: any) => {
                    const bidItem = quote.items?.find((qi: any) => qi.rfq_item_id === rfqItem.id);
                    return (
                      <td key={quote.id}>
                        {bidItem ? (
                          `$${parseFloat(bidItem.unit_price).toFixed(2)}/unit (Total: $${parseFloat(bidItem.net_price_with_gst).toFixed(2)})`
                        ) : (
                          <span className="text-danger">No Bid</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              <tr>
                <td></td>
                {quotations.map((quote: any) => (
                  <td key={quote.id} style={{ textAlign: 'center' }}>
                    <button 
                      className={`btn ${quote.id === recommendedQuote.id ? 'btn-primary' : 'btn-outline'}`}
                      disabled={submitting}
                      onClick={() => handleSelectQuote(quote.id)}
                      style={{ width: '100%' }}
                    >
                      {submitting ? "Requesting..." : "Select & Request Approval"}
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {recommendedQuote && (
          <p className="text-sm mt-4 text-muted" style={{ color: 'var(--accent)' }}>
            * <strong>{recommendedQuote.company_name || recommendedQuote.vendor_name}</strong> is recommended based on having the lowest bid price of ${calculateTotal(recommendedQuote).toLocaleString()}.
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '2rem' }}>
          <button className="btn btn-outline" onClick={() => navigate('/procurement/quotations/select')}>Back to Selection</button>
        </div>
      </div>
    </div>
  );
};

export default QuotationComparison;

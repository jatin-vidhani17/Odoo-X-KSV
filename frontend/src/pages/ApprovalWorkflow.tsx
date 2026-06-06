import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const ApprovalWorkflow = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const approvalId = searchParams.get('approvalId');

  const [approval, setApproval] = useState<any>(null);
  const [quotation, setQuotation] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Get logged in user info
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    if (!approvalId) {
      setLoading(false);
      return;
    }

    const loadApprovalData = async () => {
      try {
        setLoading(true);
        // 1. Fetch approval details: GET /api/approvals/:id
        const appRes = await apiFetch(`/approvals/${approvalId}`);
        if (appRes.success && appRes.data) {
          setApproval(appRes.data);
          
          // 2. Fetch associated quotation: GET /api/quotations/:id
          const quoteRes = await apiFetch(`/quotations/${appRes.data.quotation_id}`);
          if (quoteRes.success && quoteRes.data) {
            setQuotation(quoteRes.data);
          }
        }
      } catch (err: any) {
        console.error("Error loading approval workflow:", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadApprovalData();
  }, [approvalId]);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!approvalId || !quotation) return;
    setSubmitting(true);

    try {
      const endpoint = `/approvals/${approvalId}/${action}`;
      // Hit /api/approvals/:id/approve or /api/approvals/:id/reject
      const res = await apiFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ remarks })
      });

      if (res.success) {
        // If approved, automatically create a Purchase Order
        if (action === 'approve') {
          // Calculate total amount from quotation items
          const totalAmount = quotation.items?.reduce(
            (sum: number, it: any) => sum + parseFloat(it.net_price_with_gst || 0), 0
          ) || 0;

          // Create PO: POST /api/purchase-orders
          const poRes = await apiFetch('/purchase-orders', {
            method: 'POST',
            body: JSON.stringify({
              quotation_id: quotation.id,
              total_amount: totalAmount
            })
          });

          if (poRes.success && poRes.data) {
            // Also generate an invoice in Unpaid state for the PO: POST /api/invoices
            await apiFetch('/invoices', {
              method: 'POST',
              body: JSON.stringify({
                po_id: poRes.data.po_id
              })
            }).catch(() => {});

            // Log activity
            await apiFetch('/activity-logs', {
              method: 'POST',
              body: JSON.stringify({
                activity_type: 'Purchase Order Generation',
                log_summary: `Created Purchase Order ${poRes.data.po_number} for vendor ${quotation.company_name}`
              })
            }).catch(() => {});
          }
        }

        // Log Approval/Rejection activity
        await apiFetch('/activity-logs', {
          method: 'POST',
          body: JSON.stringify({
            activity_type: action === 'approve' ? 'Quotation Approval' : 'Quotation Rejection',
            log_summary: `${currentUser?.name || 'Manager'} ${action === 'approve' ? 'approved' : 'rejected'} quotation for RFQ: ${quotation.rfq_title}`
          })
        }).catch(() => {});

        // Redirect based on role
        if (currentUser?.role === 'Manager') {
          navigate('/manager/dashboard');
        } else {
          navigate('/procurement/dashboard');
        }
      }
    } catch (err: any) {
      alert(`Approval action failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading approval details...</div>;
  }

  if (!approvalId || !approval || !quotation) {
    return (
      <div className="p-8 text-center text-muted">
        No active approval workflow selected. 
        <br /><br />
        <button className="btn btn-outline" onClick={() => navigate('/procurement/dashboard')}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  const isManager = currentUser?.role === 'Manager';
  const totalAmount = quotation.items?.reduce((sum: number, it: any) => sum + parseFloat(it.net_price_with_gst || 0), 0) || 0;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Approval Workflow Review</h1>
        <p className="text-muted">RFQ Reference: {quotation.rfq_title}</p>
      </div>

      <div className="step-container" style={{ maxWidth: '800px', margin: '0 auto 3rem' }}>
        <div className="step completed">
          <div className="step-circle"><Check size={16} /></div>
          <span className="text-sm">Quotation Selected</span>
        </div>
        <div className="step completed">
          <div className="step-circle"><Check size={16} /></div>
          <span className="text-sm">Approval Requested</span>
        </div>
        <div className={`step ${approval.action === 'Pending' ? 'active' : 'completed'}`}>
          <div className="step-circle">{approval.action !== 'Pending' ? <Check size={16} /> : "3"}</div>
          <span className="text-sm">Under Review</span>
        </div>
        <div className={`step ${approval.action !== 'Pending' ? 'active completed' : ''}`}>
          <div className="step-circle">
            {approval.action === 'Approved' ? <Check size={16} /> : 
             approval.action === 'Rejected' ? <X size={16} /> : "4"}
          </div>
          <span className="text-sm">
            {approval.action === 'Pending' ? 'Final Status' : approval.action}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h2>Approval Details</h2>
          <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Vendor Name:</span>
              <span className="font-bold">{quotation.company_name || quotation.vendor_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Assigned Approver:</span>
              <span className="font-bold">{approval.approver_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Total Bid Amount:</span>
              <span className="font-bold" style={{ color: 'var(--accent)' }}>
                ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Workflow Status:</span>
              <span className={`badge ${
                approval.action === 'Approved' ? 'badge-success' : 
                approval.action === 'Rejected' ? 'badge-danger' : 
                'badge-warning'
              }`}>
                {approval.action}
              </span>
            </div>
          </div>

          {approval.action === 'Pending' && isManager ? (
            <div className="mt-4">
              <label className="form-label">Reviewer Remarks *</label>
              <textarea 
                className="form-control" 
                rows={3} 
                placeholder="Enter approval or rejection remarks..." 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              ></textarea>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button 
                  className="btn btn-primary" 
                  disabled={submitting} 
                  style={{ flex: 1 }} 
                  onClick={() => handleAction('approve')}
                >
                  <Check size={18} /> {submitting ? "Approving..." : "Approve & Issue PO"}
                </button>
                <button 
                  className="btn btn-outline" 
                  disabled={submitting} 
                  style={{ flex: 1, borderColor: 'var(--danger)', color: 'var(--danger)' }} 
                  onClick={() => handleAction('reject')}
                >
                  <X size={18} /> {submitting ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4" style={{ backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: '4px' }}>
              <strong>Remarks Logged:</strong>
              <p className="text-muted text-sm mt-1">{approval.remarks || "No remarks logged."}</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Bidded Items Details</h2>
          <div className="table-container mt-4">
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Total (incl. GST)</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items?.map((item: any) => (
                  <tr key={item.id}>
                    <td className="font-bold">{item.item_name}</td>
                    <td style={{ textAlign: 'right' }}>{item.quantity_bidded} {item.unit}</td>
                    <td style={{ textAlign: 'right' }}>${parseFloat(item.unit_price).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>${parseFloat(item.net_price_with_gst).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalWorkflow;

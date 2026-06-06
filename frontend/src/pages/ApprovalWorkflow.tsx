
import { Check, X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ApprovalWorkflow = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Approval Workflow</h1>
        <p className="text-muted">RFQ: Office Furniture Q3 - Vendor: Global Furniture - $11,200</p>
      </div>

      <div className="step-container" style={{ maxWidth: '800px', margin: '0 auto 3rem' }}>
        <div className="step completed">
          <div className="step-circle"><Check size={16} /></div>
          <span className="text-sm">Draft RFQ</span>
        </div>
        <div className="step completed">
          <div className="step-circle"><Check size={16} /></div>
          <span className="text-sm">Submitted</span>
        </div>
        <div className="step active">
          <div className="step-circle">3</div>
          <span className="text-sm text-muted">Under Review</span>
        </div>
        <div className="step">
          <div className="step-circle">4</div>
          <span className="text-sm text-muted">Approved / Rejected</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h2>Approval Details</h2>
          <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Requested By:</span>
              <span className="font-bold">Procurement Officer</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Department:</span>
              <span className="font-bold">Operations</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Total Amount:</span>
              <span className="font-bold" style={{ color: 'var(--accent)' }}>$ 11,200.00</span>
            </div>
          </div>

          <div className="mt-4">
            <label className="form-label">Add Remarks</label>
            <textarea className="form-control" rows={3} placeholder="Enter your remarks here..."></textarea>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/purchase-orders')}>
              <Check size={18} /> Approve
            </button>
            <button className="btn btn-outline" style={{ flex: 1, borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              <X size={18} /> Reject
            </button>
          </div>
        </div>

        <div className="card">
          <h2>Workflow History</h2>
          <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '11px', top: '24px', bottom: '0', width: '2px', backgroundColor: 'var(--border-color)' }}></div>
            
            <div style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Check size={12} />
              </div>
              <div>
                <div className="font-bold">Quotation Selected</div>
                <div className="text-sm text-muted">Procurement Officer - 10:30 AM, Today</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Check size={12} />
              </div>
              <div>
                <div className="font-bold">RFQ Published</div>
                <div className="text-sm text-muted">Procurement Officer - 09:15 AM, 12 Aug 2025</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--bg-input)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={12} className="text-muted" />
              </div>
              <div>
                <div className="font-bold text-muted">Pending Manager Approval</div>
                <div className="text-sm text-muted">Assigned to: Operations Manager</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalWorkflow;

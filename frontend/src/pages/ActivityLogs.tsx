
import { User, FileText, CheckSquare, Info } from 'lucide-react';

const ActivityLogs = () => {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Activity & Logs</h1>
        <p className="text-muted">System-wide audit trail</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button className="btn btn-primary" style={{ borderRadius: '999px' }}>All</button>
          <button className="btn btn-outline" style={{ borderRadius: '999px' }}>Approvals</button>
          <button className="btn btn-outline" style={{ borderRadius: '999px' }}>RFQs</button>
          <button className="btn btn-outline" style={{ borderRadius: '999px' }}>System</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '19px', top: '24px', bottom: '0', width: '2px', backgroundColor: 'var(--border-color)' }}></div>
          
          <div style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <CheckSquare size={20} />
            </div>
            <div style={{ flex: 1, backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="font-bold">Purchase Order Approved</span>
                <span className="text-sm text-muted">Just now</span>
              </div>
              <p className="text-muted text-sm">Manager "Sarah Jenkins" approved PO-2025-084 for Global Furniture.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--info)' }}>
              <FileText size={20} />
            </div>
            <div style={{ flex: 1, backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="font-bold">New Quotation Received</span>
                <span className="text-sm text-muted">2 hours ago</span>
              </div>
              <p className="text-muted text-sm">Vendor "TechCorp Ltd" submitted a quotation for RFQ "Office Furniture Q3".</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
              <User size={20} />
            </div>
            <div style={{ flex: 1, backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="font-bold">New Vendor Registered</span>
                <span className="text-sm text-muted">1 day ago</span>
              </div>
              <p className="text-muted text-sm">"Office Supplies Co" completed registration. Status: Pending Verification.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(148, 163, 184, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <Info size={20} />
            </div>
            <div style={{ flex: 1, backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="font-bold">System Maintenance</span>
                <span className="text-sm text-muted">2 days ago</span>
              </div>
              <p className="text-muted text-sm">Automated backup completed successfully.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;

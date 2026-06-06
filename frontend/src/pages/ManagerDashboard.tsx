import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { Clock, CheckSquare, DollarSign, ArrowRight, FileText } from 'lucide-react';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Load summary metrics
        const summaryRes = await apiFetch('/dashboard').catch(() => ({ success: false, data: null }));
        if (summaryRes.success) {
          setSummary(summaryRes.data);
        }

        // Load pending approvals list
        const approvalsRes = await apiFetch('/approvals?action=Pending');
        if (approvalsRes.success) {
          setPendingApprovals(approvalsRes.data);
        }
      } catch (error) {
        console.error('Failed to load manager dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const totalPOValue = summary?.purchase_orders?.total_value || 0;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Manager Dashboard</h1>
        <p className="text-muted">Review pending quotation workflows and approve procurement requests.</p>
      </div>

      {loading ? (
        <div className="text-center p-8">Loading dashboard metrics...</div>
      ) : (
        <>
          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <Clock size={24} />
              </div>
              <div>
                <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{pendingApprovals.length}</div>
                <div className="kpi-label" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Pending Approvals</div>
              </div>
            </div>

            <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <CheckSquare size={24} />
              </div>
              <div>
                <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{summary?.purchase_orders?.total_count || 0}</div>
                <div className="kpi-label" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Purchase Orders</div>
              </div>
            </div>

            <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <DollarSign size={24} />
              </div>
              <div>
                <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>₹{totalPOValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div className="kpi-label" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total PO Value</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} style={{ color: 'var(--primary)' }} />
              Quotations Awaiting Your Approval
            </h2>

            {pendingApprovals.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
                No pending quotations to approve. Great job!
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Approval ID</th>
                      <th>RFQ Title</th>
                      <th>Supplier Name</th>
                      <th>Workflow Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApprovals.map((app) => (
                      <tr key={app.id}>
                      <td className="font-bold">#APP-{app.id}</td>
                      <td>{app.rfq_title}</td>
                      <td>{app.vendor_name || `Supplier (User #${app.vendor_id})`}</td>
                      <td>
                        <span className="badge badge-warning">
                          {app.action}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          onClick={() => navigate(`/manager/approvals?approvalId=${app.id}`)}
                        >
                          Review & Action <ArrowRight size={14} />
                        </button>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ManagerDashboard;

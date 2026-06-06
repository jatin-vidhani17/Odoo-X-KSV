import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { FileText, ClipboardList, ShoppingCart } from 'lucide-react';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    setUser(currentUser);

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const vendorId = currentUser?.id || 11; // Fallback to 11

        // 1. Fetch Assigned RFQs
        const rfqRes = await apiFetch(`/rfqs/vendor/${vendorId}`);
        let publishedRfqs: any[] = [];
        if (rfqRes.success && Array.isArray(rfqRes.data)) {
          let publishedRfqs = rfqRes.data.filter((r: any) => r.status === 'Published');
          setRfqs(publishedRfqs);
        }

        // 2. Fetch quotations submitted by this vendor
        const quoteRes = await apiFetch('/quotations');
        let myQuotes: any[] = [];
        if (quoteRes.success && Array.isArray(quoteRes.data)) {
          myQuotes = quoteRes.data.filter((q: any) => q.vendor_id === vendorId);
          setQuotations(myQuotes);
        }

        // 3. Fetch purchase orders and filter by vendor's quotation ids
        const poRes = await apiFetch('/purchase-orders');
        if (poRes.success && Array.isArray(poRes.data)) {
          const myQuoteIds = myQuotes.map(q => q.id);
          const myPOs = poRes.data.filter((po: any) => myQuoteIds.includes(po.quotation_id));
          setPos(myPOs);
        }
      } catch (error) {
        console.error('Failed to load vendor dashboard details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Calculate new RFQs (published RFQs that the vendor hasn't bidded on yet)
  const biddedRfqIds = quotations.map(q => q.rfq_id);
  const newRfqs = rfqs.filter(r => !biddedRfqIds.includes(r.id));

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Vendor Dashboard</h1>
        <p className="text-muted">Welcome back, {user?.name || 'Partner'}! Track requests and manage your bids.</p>
      </div>

      {loading ? (
        <div className="text-center p-8">Loading dashboard metrics...</div>
      ) : (
        <>
          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <FileText size={24} />
              </div>
              <div>
                <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{newRfqs.length}</div>
                <div className="kpi-label" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>New RFQs Available</div>
              </div>
            </div>

            <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <ClipboardList size={24} />
              </div>
              <div>
                <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{quotations.length}</div>
                <div className="kpi-label" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Quotations Submitted</div>
              </div>
            </div>

            <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <ShoppingCart size={24} />
              </div>
              <div>
                <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{pos.length}</div>
                <div className="kpi-label" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Active Purchase Orders</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Open RFQs</h2>
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/vendor/rfqs')}>View All</button>
              </div>

              {newRfqs.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No new requests for quotations.
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Deadline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newRfqs.slice(0, 5).map((rfq) => (
                        <tr key={rfq.id}>
                          <td className="font-bold">{rfq.title}</td>
                          <td>{rfq.category}</td>
                          <td>{new Date(rfq.deadline).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Recent POs</h2>
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/vendor/purchase-orders')}>View All</button>
              </div>

              {pos.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No purchase orders issued yet.
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>PO Number</th>
                        <th>RFQ Reference</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pos.slice(0, 5).map((po) => (
                        <tr key={po.id}>
                          <td className="font-bold">{po.po_number}</td>
                          <td>{po.rfq_title}</td>
                          <td style={{ textAlign: 'right' }}>${parseFloat(po.total_amount).toFixed(2)}</td>
                          <td>
                            <span className="badge badge-success">{po.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VendorDashboard;

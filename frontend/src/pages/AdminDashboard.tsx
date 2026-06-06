import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { Users, UserCheck, ShieldAlert } from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setLoading(true);
        const usersRes = await apiFetch('/users');
        if (usersRes.success) {
          setUsers(usersRes.data);
        }

        const vendorsRes = await apiFetch('/vendors');
        if (vendorsRes.success) {
          setVendors(vendorsRes.data);
        }
      } catch (error) {
        console.error('Failed to load admin dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const totalUsers = users.length;
  const procurementOfficers = users.filter(u => u.role === 'Procurement Officer').length;
  const pendingVendorsCount = vendors.filter(v => v.vendor_status === 'Pending Verification').length;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Admin Dashboard</h1>
        <p className="text-muted">Manage system users, verify supplier details, and oversee ERP security.</p>
      </div>

      {loading ? (
        <div className="text-center p-8">Loading dashboard metrics...</div>
      ) : (
        <>
          <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <Users size={24} />
              </div>
              <div>
                <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{totalUsers}</div>
                <div className="kpi-label" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Users</div>
              </div>
            </div>

            <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <UserCheck size={24} />
              </div>
              <div>
                <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{procurementOfficers}</div>
                <div className="kpi-label" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Procurement Officers</div>
              </div>
            </div>

            <div className="kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <ShieldAlert size={24} />
              </div>
              <div>
                <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{pendingVendorsCount}</div>
                <div className="kpi-label" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Pending Vendor Verification</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card">
              <h2>Recent User Accounts</h2>
              <div className="table-container mt-4">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 5).map((user) => (
                      <tr key={user.id}>
                        <td className="font-bold">{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>
                          <span className={`badge ${user.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                            {user.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <h2>Recent Suppliers</h2>
              <div className="table-container mt-4">
                <table>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>GST Number</th>
                      <th>Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.slice(0, 5).map((vendor) => (
                      <tr key={vendor.vendor_id}>
                        <td className="font-bold">{vendor.company_name}</td>
                        <td>{vendor.gst_number}</td>
                        <td>
                          <span className={`badge ${
                            vendor.vendor_status === 'Approved' ? 'badge-success' :
                            vendor.vendor_status === 'Blacklisted' ? 'badge-danger' :
                            'badge-warning'
                          }`}>
                            {vendor.vendor_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

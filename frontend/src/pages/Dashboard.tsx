
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', amount: 4000 },
  { name: 'Feb', amount: 3000 },
  { name: 'Mar', amount: 2000 },
  { name: 'Apr', amount: 2780 },
  { name: 'May', amount: 1890 },
  { name: 'Jun', amount: 2390 },
];

const Dashboard = () => {
  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Dashboard</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Welcome back, Procurement Officer - Today's Overview</p>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">12</div>
          <div className="kpi-label">Active RFQs</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">5</div>
          <div className="kpi-label">Pending Approvals</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">$ 2.3k</div>
          <div className="kpi-label">Monthly Spend</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">3</div>
          <div className="kpi-label">Active Vendors</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h2>Recent Activities</h2>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span>RFQ "Office Chairs" Created</span>
              <span className="text-muted">2 hours ago</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span>PO #1029 Approved</span>
              <span className="text-muted">5 hours ago</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span>Vendor "TechCorp" Added</span>
              <span className="text-muted">1 day ago</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
              <span>Invoice #INV-22 Paid</span>
              <span className="text-muted">2 days ago</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Monthly Procurement Spend</h2>
          <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

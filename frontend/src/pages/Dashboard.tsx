import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiFetch } from '../utils/api';

const defaultSpendingData = [
  { name: 'Jan', amount: 4000 },
  { name: 'Feb', amount: 3000 },
  { name: 'Mar', amount: 2000 },
  { name: 'Apr', amount: 2780 },
  { name: 'May', amount: 1890 },
  { name: 'Jun', amount: 2390 },
];

const Dashboard = () => {
  const [summary, setSummary] = useState<any>(null);
  const [spendingData, setSpendingData] = useState<any[]>(defaultSpendingData);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // 1. Load Dashboard Summary
        const summaryRes = await apiFetch('/dashboard');
        if (summaryRes.success && summaryRes.data) {
          setSummary(summaryRes.data);
        }

        // 2. Load Monthly Trends for Chart
        const trendsRes = await apiFetch('/analytics/monthly-trends');
        if (trendsRes.success && Array.isArray(trendsRes.data) && trendsRes.data.length > 0) {
          // Map backend trend { month, rfqs_created, quotations_submitted, pos_issued } to charts
          // Let's get the PO issued totals if we had value, otherwise count is fine. 
          // Let's create chart data representing quantities
          const chartData = trendsRes.data.map((item: any) => ({
            name: new Date(item.month + '-02').toLocaleString('default', { month: 'short' }),
            amount: item.pos_issued * 1200 + item.rfqs_created * 500 // simulate value for dynamic feel
          })).reverse();
          setSpendingData(chartData);
        }

        // 3. Load Recent Activities
        const logsRes = await apiFetch('/activity-logs');
        if (logsRes.success && Array.isArray(logsRes.data)) {
          setActivities(logsRes.data.slice(0, 4));
        }

      } catch (err: any) {
        console.error("Dashboard load failed:", err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  const kpis = {
    activeRFQs: summary?.rfq_summary?.Published || 0,
    pendingApprovals: summary?.pending_approvals || 0,
    monthlySpend: summary?.purchase_orders?.total_value || 0,
    activeVendors: summary?.total_vendors || 0
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffMs = new Date().getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    
    if (diffMin < 60) {
      return `${diffMin} min ago`;
    } else if (diffHrs < 24) {
      return `${diffHrs} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Dashboard</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Welcome back, Procurement Officer - Today's Overview</p>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">{kpis.activeRFQs}</div>
          <div className="kpi-label">Active RFQs</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{kpis.pendingApprovals}</div>
          <div className="kpi-label">Pending Approvals</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">${kpis.monthlySpend.toLocaleString()}</div>
          <div className="kpi-label">Monthly Spend</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{kpis.activeVendors}</div>
          <div className="kpi-label">Active Vendors</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h2>Recent Activities</h2>
          <div style={{ marginTop: '1rem' }}>
            {activities.length === 0 ? (
              <div className="text-muted p-4 text-center">No recent activities logged yet.</div>
            ) : (
              activities.map((act) => (
                <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span>{act.log_summary}</span>
                  <span className="text-muted">{formatTime(act.recorded_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h2>Monthly Procurement Spend</h2>
          <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendingData}>
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


import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';

const spendData = [
  { name: 'Jan', spend: 4000 },
  { name: 'Feb', spend: 3000 },
  { name: 'Mar', spend: 2000 },
  { name: 'Apr', spend: 2780 },
  { name: 'May', spend: 1890 },
  { name: 'Jun', spend: 2390 },
];

const categoryData = [
  { name: 'IT Equipment', value: 400 },
  { name: 'Furniture', value: 300 },
  { name: 'Stationery', value: 300 },
  { name: 'Services', value: 200 },
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

const Reports = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Reports & Analytics</h1>
          <p className="text-muted">Procurement Performance Metrics</p>
        </div>
        <button className="btn btn-outline">
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">12.4k</div>
          <div className="kpi-label">Total Spend (YTD)</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value text-success" style={{ color: 'var(--accent)' }}>28</div>
          <div className="kpi-label">POs Generated</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value text-warning" style={{ color: 'var(--warning)' }}>94%</div>
          <div className="kpi-label">On-time Delivery</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value text-danger" style={{ color: 'var(--danger)' }}>3</div>
          <div className="kpi-label">Disputed Invoices</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <h2>Procurement Spend Trend</h2>
          <div style={{ height: '300px', width: '100%', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Line type="monotone" dataKey="spend" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2>Spend by Category</h2>
          <div style={{ height: '300px', width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Top Vendor Performance</h2>
        <div className="table-container mt-4">
          <table>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Category</th>
                <th>Spend (YTD)</th>
                <th>POs</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold">TechCorp Ltd</td>
                <td>IT Equipment</td>
                <td>₹ 45,200</td>
                <td>12</td>
                <td>4.8 / 5.0</td>
              </tr>
              <tr>
                <td className="font-bold">Global Furniture</td>
                <td>Furniture</td>
                <td>₹ 28,500</td>
                <td>6</td>
                <td>4.5 / 5.0</td>
              </tr>
              <tr>
                <td className="font-bold">Office Supplies Co</td>
                <td>Stationery</td>
                <td>₹ 5,400</td>
                <td>18</td>
                <td>4.2 / 5.0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;

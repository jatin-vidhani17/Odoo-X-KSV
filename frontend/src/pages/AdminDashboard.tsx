const AdminDashboard = () => {
  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Admin Dashboard</h1>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">24</div>
          <div className="kpi-label">Total Users</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">8</div>
          <div className="kpi-label">Procurement Officers</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">3</div>
          <div className="kpi-label">Pending Vendor Reviews</div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;

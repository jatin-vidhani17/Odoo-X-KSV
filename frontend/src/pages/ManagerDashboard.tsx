const ManagerDashboard = () => {
  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Manager Dashboard</h1>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">4</div>
          <div className="kpi-label">Pending Approvals</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">12</div>
          <div className="kpi-label">Approved This Month</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">$ 45.2k</div>
          <div className="kpi-label">Total Spend Approved</div>
        </div>
      </div>
    </div>
  );
};
export default ManagerDashboard;

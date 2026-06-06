const VendorDashboard = () => {
  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Vendor Dashboard</h1>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">2</div>
          <div className="kpi-label">New RFQs</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">5</div>
          <div className="kpi-label">Quotations Submitted</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">1</div>
          <div className="kpi-label">Active POs</div>
        </div>
      </div>
    </div>
  );
};
export default VendorDashboard;

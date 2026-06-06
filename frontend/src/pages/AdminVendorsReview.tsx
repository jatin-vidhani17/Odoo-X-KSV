const AdminVendorsReview = () => {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Review Vendors</h1>
        <p className="text-muted">Review vendors added by Procurement Officers</p>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Added By</th>
                <th>Date Added</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold">NewTech Supplies</td>
                <td>Alice Procurement</td>
                <td>Today, 10:00 AM</td>
                <td><span className="badge badge-warning">Pending Review</span></td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem' }}>Approve</button>
                    <button className="btn btn-outline text-danger" style={{ padding: '0.25rem 0.75rem' }}>Reject</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AdminVendorsReview;

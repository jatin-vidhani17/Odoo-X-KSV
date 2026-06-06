const AdminUsers = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Manage Users</h1>
          <p className="text-muted">Add and manage Procurement Officers and Managers</p>
        </div>
        <button className="btn btn-primary">+ Add User</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold">Alice Procurement</td>
                <td>alice@vendorbridge.com</td>
                <td>Procurement Officer</td>
                <td><span className="badge badge-success">Active</span></td>
                <td><button className="btn btn-outline">Edit</button></td>
              </tr>
              <tr>
                <td className="font-bold">Bob Manager</td>
                <td>bob@vendorbridge.com</td>
                <td>Manager</td>
                <td><span className="badge badge-success">Active</span></td>
                <td><button className="btn btn-outline">Edit</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AdminUsers;

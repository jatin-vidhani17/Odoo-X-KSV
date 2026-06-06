
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

const Vendors = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Vendors</h1>
          <p className="text-muted">Manage Supplier profiles and registrations</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Add Vendor
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search vendors by name or category..." 
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <select className="form-control" style={{ width: 'auto' }}>
            <option>All Categories</option>
            <option>IT Equipment</option>
            <option>Furniture</option>
            <option>Stationery</option>
          </select>
          <select className="form-control" style={{ width: 'auto' }}>
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Category</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold">TechCorp Ltd</td>
                <td>IT Equipment</td>
                <td>Jane Doe</td>
                <td>jane@techcorp.com</td>
                <td><span className="badge badge-success">Active</span></td>
                <td>
                  <div className="flex gap-2">
                    <button className="text-muted hover:text-white" aria-label="Edit"><Edit size={16} /></button>
                    <button className="text-danger hover:text-white" aria-label="Delete"><Trash2 size={16} color="var(--danger)"/></button>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="font-bold">Office Supplies Co</td>
                <td>Stationery</td>
                <td>John Smith</td>
                <td>john@officesupplies.com</td>
                <td><span className="badge badge-success">Active</span></td>
                <td>
                  <div className="flex gap-2">
                    <button className="text-muted"><Edit size={16} /></button>
                    <button className="text-danger"><Trash2 size={16} color="var(--danger)"/></button>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="font-bold">Global Furniture</td>
                <td>Furniture</td>
                <td>Mike Johnson</td>
                <td>mike@globalfurniture.com</td>
                <td><span className="badge badge-warning">Inactive</span></td>
                <td>
                  <div className="flex gap-2">
                    <button className="text-muted"><Edit size={16} /></button>
                    <button className="text-danger"><Trash2 size={16} color="var(--danger)"/></button>
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

export default Vendors;

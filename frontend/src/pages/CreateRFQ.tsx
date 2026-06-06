
import { useNavigate } from 'react-router-dom';

const CreateRFQ = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Create RFQ's</h1>
        <p className="text-muted">New request for quotation</p>
      </div>

      <div className="step-container" style={{ maxWidth: '600px', margin: '0 auto 3rem' }}>
        <div className="step active">
          <div className="step-circle">1</div>
          <span className="text-sm">Details</span>
        </div>
        <div className="step">
          <div className="step-circle">2</div>
          <span className="text-sm text-muted">Vendors</span>
        </div>
        <div className="step">
          <div className="step-circle">3</div>
          <span className="text-sm text-muted">Review</span>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form>
          <div className="form-group">
            <label className="form-label">RFQ Title</label>
            <input type="text" className="form-control" placeholder="e.g., Office Furniture Procurement Q3" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Product/Service Category</label>
              <select className="form-control">
                <option>Select Category</option>
                <option>IT Equipment</option>
                <option>Furniture</option>
                <option>Stationery</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Submission Deadline</label>
              <input type="date" className="form-control" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={4} placeholder="Detailed description of requirements..."></textarea>
          </div>

          <div className="table-container" style={{ marginBottom: '1.5rem' }}>
            <table style={{ border: '1px solid var(--border-color)' }}>
              <thead style={{ backgroundColor: 'var(--bg-input)' }}>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><input type="text" className="form-control" placeholder="Item name" /></td>
                  <td><input type="number" className="form-control" placeholder="0" /></td>
                  <td>
                    <select className="form-control">
                      <option>Pcs</option>
                      <option>Boxes</option>
                      <option>Kg</option>
                    </select>
                  </td>
                  <td>
                    <button type="button" className="text-danger">Remove</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <button type="button" className="btn btn-outline mt-4" style={{ fontSize: '0.875rem' }}>
              + Add Item
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/quotations/select')}>Next: Select Vendors</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRFQ;

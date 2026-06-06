
import { useNavigate } from 'react-router-dom';

const SelectQuotations = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Select Quotations</h1>
        <p className="text-muted">RFQ: Office Furniture Procurement Q3 - Deadline: 15 Aug 2025</p>
      </div>

      <div className="card">
        <h2 className="mb-4">Received Quotations</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Total Price</th>
                <th>Delivery Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold">TechCorp Ltd</td>
                <td>$ 12,500</td>
                <td>14 Days</td>
                <td><span className="badge badge-success">Submitted</span></td>
                <td>
                  <input type="checkbox" style={{ transform: 'scale(1.2)' }} defaultChecked />
                </td>
              </tr>
              <tr>
                <td className="font-bold">Global Furniture</td>
                <td>$ 11,200</td>
                <td>21 Days</td>
                <td><span className="badge badge-success">Submitted</span></td>
                <td>
                  <input type="checkbox" style={{ transform: 'scale(1.2)' }} defaultChecked />
                </td>
              </tr>
              <tr>
                <td className="font-bold">Office Supplies Co</td>
                <td>-</td>
                <td>-</td>
                <td><span className="badge badge-warning">Pending</span></td>
                <td>
                  <input type="checkbox" style={{ transform: 'scale(1.2)' }} disabled />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/rfqs/create')}>Back</button>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/quotations/compare')}>Compare Selected</button>
        </div>
      </div>
    </div>
  );
};

export default SelectQuotations;

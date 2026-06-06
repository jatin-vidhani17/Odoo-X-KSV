
import { useNavigate } from 'react-router-dom';

const QuotationComparison = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>Quotation Comparison</h1>
        <p className="text-muted">RFQ: Office Furniture Procurement Q3 - 2 Quotations received</p>
      </div>

      <div className="card">
        <div className="table-container">
          <table style={{ border: '1px solid var(--border-color)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-input)' }}>
                <th>Criteria</th>
                <th style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent)' }}>Global Furniture</th>
                <th>TechCorp Ltd</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold text-muted">Total Price</td>
                <td style={{ color: 'var(--accent)', fontWeight: 'bold' }}>$ 11,200</td>
                <td>$ 12,500</td>
              </tr>
              <tr>
                <td className="font-bold text-muted">Delivery Time</td>
                <td>21 Days</td>
                <td>14 Days</td>
              </tr>
              <tr>
                <td className="font-bold text-muted">Warranty</td>
                <td>2 Years</td>
                <td>1 Year</td>
              </tr>
              <tr>
                <td className="font-bold text-muted">Vendor Rating</td>
                <td>4.5 / 5.0</td>
                <td>4.8 / 5.0</td>
              </tr>
              <tr>
                <td className="font-bold text-muted">Payment Terms</td>
                <td>Net 30</td>
                <td>Net 15</td>
              </tr>
              <tr>
                <td></td>
                <td style={{ textAlign: 'center' }}>
                  <button className="btn btn-primary" onClick={() => navigate('/approvals')} style={{ width: '100%' }}>Select & Request Approval</button>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button className="btn btn-outline" style={{ width: '100%' }}>Select</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm mt-4 text-muted" style={{ color: 'var(--danger)' }}>* Global Furniture is recommended based on the lowest price.</p>
      </div>
    </div>
  );
};

export default QuotationComparison;

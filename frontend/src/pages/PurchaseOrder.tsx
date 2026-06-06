
import { Download, Printer, Mail } from 'lucide-react';

const PurchaseOrder = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Purchase Order & Invoice</h1>
          <p className="text-muted">PO-2025 auto generated after approval</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline"><Download size={18} /> PDF</button>
          <button className="btn btn-outline"><Printer size={18} /> Print</button>
          <button className="btn btn-outline"><Mail size={18} /> Email</button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ color: 'var(--accent)', fontSize: '2rem', marginBottom: '1rem' }}>PURCHASE ORDER</h2>
            <div className="text-muted text-sm">
              <div>VendorBridge ERP</div>
              <div>123 Enterprise Way</div>
              <div>Tech District, NY 10001</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '1rem' }}>
              <span className="text-muted mr-2">PO Number:</span>
              <span className="font-bold text-lg">#PO-2025-084</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '0.5rem', textAlign: 'left', background: 'var(--bg-input)', padding: '1rem', borderRadius: '0.5rem' }}>
              <span className="text-muted">Date:</span>
              <span className="font-bold">12 Aug 2025</span>
              <span className="text-muted">Payment Terms:</span>
              <span className="font-bold">Net 30</span>
              <span className="text-muted">Delivery Date:</span>
              <span className="font-bold">02 Sep 2025</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <h3 className="text-muted text-sm uppercase mb-2">Vendor To:</h3>
            <div className="font-bold text-lg">Global Furniture</div>
            <div className="text-muted text-sm">
              <div>456 Supplier Blvd</div>
              <div>Industrial Park, CA 90001</div>
              <div>mike@globalfurniture.com</div>
              <div>+1 (555) 123-4567</div>
            </div>
          </div>
          <div>
            <h3 className="text-muted text-sm uppercase mb-2">Ship To:</h3>
            <div className="font-bold text-lg">VendorBridge HQ</div>
            <div className="text-muted text-sm">
              <div>Attn: Receiving Dept</div>
              <div>123 Enterprise Way</div>
              <div>Tech District, NY 10001</div>
            </div>
          </div>
        </div>

        <div className="table-container" style={{ marginBottom: '2rem' }}>
          <table style={{ border: '1px solid var(--border-color)' }}>
            <thead style={{ backgroundColor: 'var(--bg-input)' }}>
              <tr>
                <th>Item Description</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ergonomic Office Chair (Mesh)</td>
                <td style={{ textAlign: 'center' }}>20</td>
                <td style={{ textAlign: 'right' }}>$ 250.00</td>
                <td style={{ textAlign: 'right' }}>$ 5,000.00</td>
              </tr>
              <tr>
                <td>Standing Desk (Motorized)</td>
                <td style={{ textAlign: 'center' }}>10</td>
                <td style={{ textAlign: 'right' }}>$ 550.00</td>
                <td style={{ textAlign: 'right' }}>$ 5,500.00</td>
              </tr>
              <tr>
                <td>Monitor Arm (Dual)</td>
                <td style={{ textAlign: 'center' }}>10</td>
                <td style={{ textAlign: 'right' }}>$ 70.00</td>
                <td style={{ textAlign: 'right' }}>$ 700.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <span className="text-muted">Subtotal:</span>
              <span className="font-bold">$ 11,200.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span className="text-muted">Tax (8%):</span>
              <span className="font-bold">$ 896.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0' }}>
              <span className="font-bold text-lg">Grand Total:</span>
              <span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>$ 12,096.00</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 text-center text-muted text-sm" style={{ borderTop: '1px solid var(--border-color)' }}>
          <p>Please include PO Number on all invoices and shipping documents.</p>
          <div className="mt-4 flex justify-between">
            <button className="text-accent" style={{ color: 'var(--info)' }}>View Matching Invoice</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrder;

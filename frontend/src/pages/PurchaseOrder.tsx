import { useEffect, useState } from 'react';
import { Printer, Mail } from 'lucide-react';
import { apiFetch } from '../utils/api';

const PurchaseOrder = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [selectedPoId, setSelectedPoId] = useState<number | ''>('');
  const [poDetails, setPoDetails] = useState<any>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchPurchaseOrders = async () => {
    try {
      setLoadingList(true);
      const res = await apiFetch('/purchase-orders');
      if (res.success && Array.isArray(res.data)) {
        setPurchaseOrders(res.data);
        if (res.data.length > 0) {
          setSelectedPoId(res.data[0].id);
        }
      }
    } catch (err: any) {
      console.error("Error loading PO list:", err.message);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    if (!selectedPoId) {
      setPoDetails(null);
      setInvoice(null);
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoadingDetails(true);
        // 1. Fetch PO details: GET /api/purchase-orders/:id
        const res = await apiFetch(`/purchase-orders/${selectedPoId}`);
        if (res.success && res.data) {
          setPoDetails(res.data);
        }

        // 2. Fetch all invoices to locate the one matching this po_id
        const invRes = await apiFetch('/invoices');
        if (invRes.success && Array.isArray(invRes.data)) {
          const matchingInvoice = invRes.data.find((inv: any) => inv.po_id === selectedPoId);
          if (matchingInvoice) {
            setInvoice(matchingInvoice);
          } else {
            setInvoice(null);
          }
        }
      } catch (err: any) {
        console.error("Error loading PO details:", err.message);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedPoId]);

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = async () => {
    if (!invoice) {
      alert("No matching invoice generated yet to email.");
      return;
    }

    setSendingEmail(true);
    try {
      // Hit email invoice: POST /api/invoices/:id/email
      const res = await apiFetch(`/invoices/${invoice.id}/email`, {
        method: 'POST',
        body: JSON.stringify({
          email_address: poDetails?.vendor_email
        })
      });
      if (res.success) {
        alert(res.message);
      }
    } catch (err: any) {
      alert(`Email dispatch failed: ${err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handlePayInvoice = async () => {
    if (!invoice) return;
    try {
      // Hit pay invoice: PATCH /api/invoices/:id/pay
      const res = await apiFetch(`/invoices/${invoice.id}/pay`, {
        method: 'PATCH'
      });
      if (res.success) {
        alert("Payment processed successfully!");
        // Refresh PO details
        if (selectedPoId) {
          const detailRes = await apiFetch(`/purchase-orders/${selectedPoId}`);
          if (detailRes.success) setPoDetails(detailRes.data);
        }
        // Refresh invoice list
        const invRes = await apiFetch('/invoices');
        if (invRes.success && Array.isArray(invRes.data)) {
          const matchingInvoice = invRes.data.find((inv: any) => inv.po_id === selectedPoId);
          if (matchingInvoice) setInvoice(matchingInvoice);
        }
      }
    } catch (err: any) {
      alert(`Payment failed: ${err.message}`);
    }
  };

  if (loadingList) {
    return <div className="p-8 text-center">Loading Purchase Orders...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Purchase Order & Invoice</h1>
          <p className="text-muted">
            {poDetails ? `PO Number: ${poDetails.po_number}` : "Manage generated purchase orders"}
          </p>
        </div>
        {poDetails && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={handlePrint}><Printer size={18} /> Print</button>
            <button className="btn btn-outline" disabled={sendingEmail || !invoice} onClick={handleEmail}>
              <Mail size={18} /> {sendingEmail ? "Sending..." : "Email Invoice"}
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', maxWidth: '500px' }}>
        <div className="form-group">
          <label className="form-label">Select Active Purchase Order *</label>
          <select 
            className="form-control" 
            value={selectedPoId} 
            onChange={(e) => setSelectedPoId(parseInt(e.target.value, 10) || '')}
          >
            <option value="">Select PO...</option>
            {purchaseOrders.map(po => (
              <option key={po.id} value={po.id}>{po.po_number} - {po.company_name} (${parseFloat(po.total_amount).toLocaleString()})</option>
            ))}
          </select>
        </div>
      </div>

      {loadingDetails ? (
        <div className="text-center p-8 card">Loading PO details...</div>
      ) : !poDetails ? (
        <div className="text-center p-8 text-muted card">
          Please select a Purchase Order reference from the dropdown above.
        </div>
      ) : (
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
                <span className="text-muted mr-2">PO Reference:</span>
                <span className="font-bold text-lg">{poDetails.po_number}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '0.5rem', textAlign: 'left', background: 'var(--bg-input)', padding: '1rem', borderRadius: '0.5rem' }}>
                <span className="text-muted">Date:</span>
                <span className="font-bold">{new Date(poDetails.created_at).toLocaleDateString()}</span>
                <span className="text-muted">Status:</span>
                <span className={`badge ${
                  poDetails.status === 'Completed' ? 'badge-success' : 
                  poDetails.status === 'Cancelled' ? 'badge-danger' : 
                  'badge-info'
                }`}>
                  {poDetails.status}
                </span>
                <span className="text-muted">RFQ Ref:</span>
                <span className="font-bold">{poDetails.rfq_title}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <h3 className="text-muted text-sm uppercase mb-2">Vendor To:</h3>
              <div className="font-bold text-lg">{poDetails.company_name || poDetails.vendor_name}</div>
              <div className="text-muted text-sm">
                <div>{poDetails.vendor_address || 'Vendor Address Not Set'}</div>
                <div>Email: {poDetails.vendor_email}</div>
                <div>Phone: {poDetails.vendor_phone || 'N/A'}</div>
                <div>GSTIN: {poDetails.gst_number}</div>
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
                  <th style={{ textAlign: 'right' }}>GST</th>
                  <th style={{ textAlign: 'right' }}>Total (incl. GST)</th>
                </tr>
              </thead>
              <tbody>
                {poDetails.items?.map((item: any) => (
                  <tr key={item.id}>
                    <td>{item.item_name}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity_bidded} {item.unit}</td>
                    <td style={{ textAlign: 'right' }}>${parseFloat(item.unit_price).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{parseFloat(item.gst_percentage).toFixed(1)}%</td>
                    <td style={{ textAlign: 'right' }}>${parseFloat(item.net_price_with_gst).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0' }}>
                <span className="font-bold text-lg">Grand Total:</span>
                <span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>
                  ${parseFloat(poDetails.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {invoice && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-input)', padding: '1rem', borderRadius: '4px' }}>
              <div>
                <strong>Associated Invoice: {invoice.invoice_number}</strong>
                <div className="text-sm text-muted">Status: {invoice.status} | Tax: ${parseFloat(invoice.tax_amount).toFixed(2)}</div>
              </div>
              {invoice.status === 'Unpaid' ? (
                <button className="btn btn-primary" onClick={handlePayInvoice}>
                  Pay Invoice
                </button>
              ) : (
                <span className="badge badge-success">Slipped & Settled</span>
              )}
            </div>
          )}

          <div className="mt-4 pt-4 text-center text-muted text-sm" style={{ borderTop: '1px solid var(--border-color)' }}>
            <p>Please include PO Number on all invoices and shipping documents.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrder;
